import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const RejectedScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const rejectionNote = route?.params?.rejectionNote || 'No additional information provided.';

  const handleReapply = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DocumentUpload', params: { isReapply: true } }],
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('therapistToken');
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF2F2" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon name="close-circle" size={56} color="#EF4444" />
          </View>
        </View>

        <Text style={styles.title}>Application Rejected</Text>
        <Text style={styles.subtitle}>
          Unfortunately, your application has been rejected by the admin team.
        </Text>

        {/* Rejection Note Card */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Icon name="chatbox-ellipses" size={20} color="#DC2626" />
            <Text style={styles.noteTitle}>Admin Feedback</Text>
          </View>
          <Text style={styles.noteText}>{rejectionNote}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            You can reapply by re-uploading your documents. Your personal information will be preserved.
          </Text>
        </View>

        {/* Reapply Button */}
        <TouchableOpacity style={styles.reapplyButton} onPress={handleReapply} activeOpacity={0.85}>
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.reapplyText}>Reapply with New Documents</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="log-out-outline" size={18} color="#6B7280" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2F2' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 32, paddingBottom: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#991B1B', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  noteCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#EF4444',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  noteTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  noteText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EEF2FF',
    borderRadius: 12, padding: 14, marginBottom: 28, gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 18 },
  reapplyButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, gap: 10,
    shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  reapplyText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  logoutText: { fontSize: 14, color: '#6B7280' },
});

export default RejectedScreen;
