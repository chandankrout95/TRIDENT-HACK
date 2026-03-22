import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { SessionsSkeleton } from '../../shared/components/Skeleton';
import { getSocket } from '../../services/socket';

const SessionsScreen = () => {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = (silent = false) => {
    if (!silent) setIsLoading(true);
    apiClient.get('/user/sessions')
      .then(res => {
        // Sort sessions by date descending (latest first)
        const sorted = (res.data || []).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setSessions(sorted);
      })
      .catch(err => console.error(err))
      .finally(() => { setIsLoading(false); setRefreshing(false); });
  };

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchSessions(true);
    }, [])
  );

  // Real-time new appointment listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewAppointment = (appointment) => {
      setSessions(prev => {
        const exists = prev.find(s => s._id === appointment._id);
        if (exists) return prev;
        return [appointment, ...prev]; // Add at top (latest first)
      });
    };

    const onStatusUpdate = (updatedSess) => {
      setSessions(prev => prev.map(s => s._id === updatedSess._id ? { ...s, status: updatedSess.status, completionOtp: updatedSess.completionOtp } : s));
    };

    socket.on('new_appointment', onNewAppointment);
    socket.on('session_status_update', onStatusUpdate);
    
    return () => {
      socket.off('new_appointment', onNewAppointment);
      socket.off('session_status_update', onStatusUpdate);
    };
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchSessions(true); };

  const getFilteredSessions = () => {
    if (activeTab === 'upcoming') return sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');
    if (activeTab === 'completed') return sessions.filter(s => s.status === 'completed');
    if (activeTab === 'cancelled') return sessions.filter(s => s.status === 'cancelled');
    return sessions;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { bg: '#DCFCE7', text: '#16A34A' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'completed': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'completed': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
      default: return 'ellipse';
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const renderSession = ({ item }) => {
    const therapist = item.therapist || {};
    const sc = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => navigation.navigate('AppointmentDetail', { session: item })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardAvatar}>
            <Icon name="person-circle" size={48} color="#4338CA" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.therapistName}>{therapist.name || 'Therapist'}</Text>
            <Text style={styles.therapistSpec}>{therapist.specialization || 'General'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={sc.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardBottomRow}>
          <View style={styles.detailItem}>
            <Icon name="calendar-outline" size={18} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="time-outline" size={18} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>{item.timeSlot}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filtered = getFilteredSessions();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('SearchScreen')}>
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar (Tappable) */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('SearchScreen')}
      >
        <Icon name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
        <Text style={styles.searchPlaceholder}>Find a new therapist...</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {['upcoming', 'completed', 'cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session List */}
      {isLoading ? (
        <SessionsSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderSession}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="calendar-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No {activeTab} sessions</Text>
              <Text style={styles.emptyText}>Search for a therapist to book your first session.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('SearchScreen')}>
                <Icon name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.emptyBtnText}>Find Therapist</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 6 },

  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 15, marginBottom: 10, backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  searchPlaceholder: { fontSize: 16, color: '#9CA3AF' },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFF' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  sessionCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  cardAvatar: { marginRight: 12 },
  cardInfo: { flex: 1 },
  therapistName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  therapistSpec: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },

  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 25, backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 6 },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default SessionsScreen;
