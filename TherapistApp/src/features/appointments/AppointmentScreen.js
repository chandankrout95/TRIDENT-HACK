import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import Skeleton from '../../components/common/Skeleton';
import { getSocket } from '../../services/socket';

const AppointmentScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'history'

  useFocusEffect(
    useCallback(() => {
      fetchAppointments(true);
    }, [])
  );

  // Real-time new appointment listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewAppointment = (appointment) => {
      setAppointments(prev => {
        // Avoid duplicates
        const exists = prev.find(a => a._id === appointment._id);
        if (exists) return prev;
        return [appointment, ...prev];
      });
    };

    socket.on('new_appointment', onNewAppointment);
    return () => socket.off('new_appointment', onNewAppointment);
  }, []);

  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const { data } = await apiClient.get('/therapist/sessions');
      // Sort latest first
      const sorted = (data || []).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      setAppointments(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'upcoming') return app.status !== 'completed' && app.status !== 'cancelled';
    return app.status === 'completed' || app.status === 'cancelled';
  });

  const renderAppointment = ({ item, index }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.time}>{item.timeSlot || '09:00 AM'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#D1FAE5' : '#F3F4F6' }]}>
          <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#059669' : '#6B7280' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.clientInfoRow}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>{(item.user?.name || item.user?._id || 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.clientName}>Client ID: {String(item.user?._id || item.user || '').substring(0, 8)}</Text>
          <Text style={styles.type}>Mental Health Consultation</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Skeleton width={100} height={20} />
                <Skeleton width={80} height={24} borderRadius={8} />
              </View>
              <Skeleton width={150} height={18} style={{ marginTop: 12 }} />
              <Skeleton width={200} height={14} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAppointments(true); }}
              colors={['#10B981']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No appointments found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginRight: 8 },
  activeTab: { backgroundColor: '#10B981' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFF' },
  list: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  time: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  clientInfoRow: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#6B7280' },
  clientName: { fontSize: 16, fontWeight: '700', color: '#374151' },
  type: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
});

export default AppointmentScreen;
