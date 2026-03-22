import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { setCredentials, logout } from '../../store/authSlice';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socket';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WaitingApprovalScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animated pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Socket listener for approval/rejection
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const userId = user?._id;

    socket.on('therapist_approved', (data) => {
      if (data.userId === userId) {
        handleRefresh();
      }
    });

    socket.on('therapist_rejected', (data) => {
      if (data.userId === userId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Rejected', params: { rejectionNote: data.rejectionNote } }],
        });
      }
    });

    return () => {
      socket.off('therapist_approved');
      socket.off('therapist_rejected');
    };
  }, [user?._id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Spin animation
    spinAnim.setValue(0);
    Animated.timing(spinAnim, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }).start();

    try {
      const { data } = await apiClient.get('/therapist/application-status');

      if (data.status === 'approved') {
        // Fetch full profile and navigate
        const { data: me } = await apiClient.get('/auth/me');
        dispatch(setCredentials({ token, user: me }));
        // Navigator will handle routing to Main
      } else if (data.status === 'rejected') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Rejected', params: { rejectionNote: data.rejectionNote } }],
        });
      }
    } catch (error) {
      console.error('Refresh failed:', error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('therapistToken');
    dispatch(logout());
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3FF" />
      <View style={styles.content}>
        {/* Animated Icon */}
        <View style={styles.animContainer}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.iconCircle}>
            <Icon name="time" size={48} color="#7C3AED" />
          </View>
        </View>

        <Text style={styles.title}>Application Submitted</Text>
        <Text style={styles.subtitle}>
          Your application is being reviewed by our admin team. You'll be notified once a decision is made.
        </Text>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Icon name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Profile information submitted</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>Documents uploaded</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="ellipsis-horizontal-circle" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>Waiting for admin review...</Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}
          disabled={isRefreshing} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="refresh" size={20} color="#7C3AED" />
          </Animated.View>
          <Text style={styles.refreshText}>
            {isRefreshing ? 'Checking...' : 'Check Status'}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="log-out-outline" size={18} color="#6B7280" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  animContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  pulseCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#EDE9FE' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#7C3AED', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E1B4B', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  statusCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  statusText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 10, marginBottom: 16,
  },
  refreshText: { fontSize: 15, fontWeight: '600', color: '#7C3AED' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  logoutText: { fontSize: 14, color: '#6B7280' },
});

export default WaitingApprovalScreen;
