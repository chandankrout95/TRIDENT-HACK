import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Skeleton from '../../components/common/Skeleton';
import { getSocket } from '../../services/socket';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const [sessions, setSessions] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [earningsData, setEarningsData] = useState({ availableBalance: 0, recentTransactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [sessionsRes, convoRes, earningsRes] = await Promise.all([
        apiClient.get('/therapist/sessions'),
        apiClient.get('/chat/conversations').catch(() => ({ data: [] })),
        apiClient.get('/transactions/earnings').catch(() => ({ data: { availableBalance: 0, recentTransactions: [] } }))
      ]);
      setSessions(sessionsRes.data);
      setConversations(convoRes.data);
      setEarningsData(earningsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [])
  );

  // Real-time new appointment listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewAppointment = (appointment) => {
      setSessions(prev => [appointment, ...prev]);
    };

    const onStatusUpdate = (updatedSess) => {
      setSessions(prev => prev.map(s => s._id === updatedSess._id ? { ...s, status: updatedSess.status } : s));
    };

    socket.on('new_appointment', onNewAppointment);
    socket.on('session_status_update', onStatusUpdate);
    
    return () => {
      socket.off('new_appointment', onNewAppointment);
      socket.off('session_status_update', onStatusUpdate);
    };
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'confirmed').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const todaySessions = sessions.filter(s => {
    if (!s.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return s.date.split('T')[0] === today && s.status === 'confirmed';
  });
  const pendingRequests = sessions.filter(s => s.status === 'pending').length;

  const getTimeLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="account" size={24} color="#10B981" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}> {user?.name || user?.email?.split('@')[0] || 'Therapist'} ✨</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('NotificationScreen')}>
          <Icon name="bell-outline" size={24} color="#374151" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Real-time Status Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statusCardContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusLabel}>Dashboard Overview</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeSessions}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedSessions}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.therapistProfile?.rating || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Today's Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
        </View>
        <Animated.View entering={FadeInRight.delay(200)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.todayCardsScroll}>
            <View style={[styles.todayCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="calendar-clock" size={24} color="#10B981" />
              </View>
              <Text style={styles.todayCardValue}>{todaySessions.length}</Text>
              <Text style={styles.todayCardLabel}>Sessions Today</Text>
            </View>
            <View style={[styles.todayCard, { backgroundColor: '#FFF7ED' }]}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#FFEDD5' }]}>
                <Icon name="clock-alert-outline" size={24} color="#F97316" />
              </View>
              <Text style={styles.todayCardValue}>{pendingRequests}</Text>
              <Text style={styles.todayCardLabel}>Pending</Text>
            </View>
            <View style={[styles.todayCard, { backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="message-text-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.todayCardValue}>{conversations.length}</Text>
              <Text style={styles.todayCardLabel}>Conversations</Text>
            </View>
            <View style={[styles.todayCard, { backgroundColor: '#FAF5FF' }]}>
              <View style={[styles.todayCardIcon, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="star-outline" size={24} color="#A855F7" />
              </View>
              <Text style={styles.statValue}>{user?.therapistProfile?.rating || '0.0'}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Recent Messages */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View>
            {[1, 2, 3].map((_, i) => (
              <View key={i} style={styles.messageCard}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginRight: 14 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width={120} height={16} />
                  <Skeleton width={180} height={14} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={40} height={12} />
              </View>
            ))}
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="message-text-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          conversations.slice(0, 3).map((convo, index) => (
            <Animated.View key={convo.partnerId} entering={FadeInUp.delay(100 * index)}>
              <TouchableOpacity
                style={styles.messageCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ChatScreen', {
                  clientId: convo.partnerId,
                  clientName: convo.partnerName,
                })}
              >
                <View style={[styles.messageAvatar, convo.unreadCount > 0 && styles.messageAvatarUnread]}>
                  <Icon name="account" size={22} color={convo.unreadCount > 0 ? '#FFF' : '#9CA3AF'} />
                </View>
                <View style={styles.messageContent}>
                  <Text style={[styles.messageName, convo.unreadCount > 0 && { fontWeight: '800' }]} numberOfLines={1}>
                    {convo.partnerName}
                  </Text>
                  <Text style={[styles.messagePreview, convo.unreadCount > 0 && { color: '#111827', fontWeight: '600' }]} numberOfLines={1}>
                    {convo.lastMessage?.content || 'No messages yet'}
                  </Text>
                </View>
                <View style={styles.messageRight}>
                  <Text style={[styles.messageTime, convo.unreadCount > 0 && { color: '#10B981' }]}>
                    {getTimeLabel(convo.lastMessage?.createdAt)}
                  </Text>
                  {convo.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{convo.unreadCount > 99 ? '99+' : convo.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        {/* Upcoming Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View>
            {[1, 2, 3].map((_, i) => (
              <View key={i} style={styles.appointmentCard}>
                <Skeleton width={60} height={30} borderRadius={12} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width={40} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width={120} height={18} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        ) : sessions.filter(s => s.status === 'confirmed').length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>No upcoming sessions</Text>
          </View>
        ) : (
          sessions.filter(s => s.status === 'confirmed').slice(0, 3).map((session, index) => (
            <Animated.View key={session._id || index} entering={FadeInUp.delay(100 * index)}>
              <TouchableOpacity
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('Appointments')}
              >
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{session.timeSlot?.split(' - ')[0] || '09:00'}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.clientLabel}>Client</Text>
                  <Text style={styles.clientName}>#{String(session.user?._id || session.user || '').substring(0, 8)}</Text>
                </View>
                <View style={styles.sessionStatusBadge}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}        {/* Earnings & Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings & Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeInUp.delay(300)}>
          {isLoading ? (
            <View style={[styles.earningsCard, { padding: 24 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
                <View>
                  <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={160} height={36} />
                </View>
                <Skeleton width={100} height={40} borderRadius={12} />
              </View>
              <Skeleton width={140} height={18} style={{ marginBottom: 16 }} />
              {[1, 2, 3].map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width={80} height={12} />
                  </View>
                  <Skeleton width={60} height={16} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.earningsCard}>
              <View style={styles.earningsHeader}>
                <View>
                  <Text style={styles.earningsLabel}>Available Balance</Text>
                  <Text style={styles.earningsAmount}>₹{earningsData?.availableBalance || 0}</Text>
                </View>
                <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate('Withdraw')}>
                  <Text style={styles.withdrawBtnText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.transactionsList}>
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                {earningsData?.recentTransactions?.length === 0 ? (
                  <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No recent transactions</Text>
                ) : (
                  earningsData?.recentTransactions?.map((tx, idx) => (
                    <View key={tx._id || idx} style={styles.transactionItem}>
                      <View style={styles.txIconContainer}>
                        <Icon name={tx.type === 'earning' ? 'arrow-down' : 'arrow-up'} size={20} color={tx.type === 'earning' ? '#10B981' : '#EF4444'} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                      </View>
                      <View>
                        <Text style={[styles.txAmount, { color: tx.type === 'earning' ? '#10B981' : '#111827' }]}>
                          {tx.type === 'earning' ? '+' : '-'}₹{tx.amount}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Performance Insights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
        </View>
        <Animated.View entering={FadeInUp.delay(300)} style={styles.insightsCard}>
          <View style={styles.insightsRow}>
            <View style={styles.insightItem}>
              <View style={[styles.insightCircle, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="trending-up" size={22} color="#10B981" />
              </View>
              <Text style={styles.insightValue}>{completedSessions}</Text>
              <Text style={styles.insightLabel}>This Week</Text>
            </View>
            <View style={styles.insightItem}>
              <View style={[styles.insightCircle, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="percent" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.insightValue}>
                {sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0}%
              </Text>
              <Text style={styles.insightLabel}>Completion</Text>
            </View>
            <View style={styles.insightItem}>
              <View style={[styles.insightCircle, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock-fast" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.insightValue}>{activeSessions}</Text>
              <Text style={styles.insightLabel}>In Progress</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTextContainer: { marginLeft: 12 },
  greeting: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 2 },
  profileBtn: {
    shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10B981' },
  notificationBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
  scrollContent: { paddingHorizontal: 24 },
  statusCardContainer: { marginVertical: 10 },
  statusCard: { borderRadius: 32, padding: 24, backgroundColor: '#111827' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusLabel: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  liveText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  seeAllText: { fontSize: 14, color: '#10B981', fontWeight: '700' },

  // Today's Overview Cards
  todayCardsScroll: { marginLeft: -4 },
  todayCard: {
    width: 130,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    marginLeft: 4,
  },
  todayCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  todayCardValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  todayCardLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  // Recent Messages
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messageAvatar: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
    marginRight: 14
  },
  messageAvatarUnread: { backgroundColor: '#10B981' },
  messageContent: { flex: 1 },
  messageName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  messagePreview: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  messageRight: { alignItems: 'flex-end' },
  messageTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Upcoming Sessions
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  timeBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 16 },
  timeText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  appointmentInfo: { flex: 1 },
  clientLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  clientName: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  sessionStatusBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },

  // Performance Insights
  insightsCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  insightsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  insightItem: { alignItems: 'center' },
  insightCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  insightValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  insightLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500', marginTop: 8 },

  // Earnings & Transactions
  earningsCard: { marginHorizontal: 0, marginBottom: 20, backgroundColor: '#FFF', borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  earningsHeader: { backgroundColor: '#10B981', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel: { color: '#D1FAE5', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  earningsAmount: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText: { color: '#10B981', fontWeight: '700', fontSize: 14 },
  transactionsList: { padding: 20 },
  transactionsTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  txIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 15, fontWeight: '600', color: '#374151' },
  txDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' }
});

export default HomeScreen;
