import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { NotificationsSkeleton } from '../../shared/components/Skeleton';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = () => {
    apiClient.get('/notifications/my')
      .then(res => setNotifications(res.data))
      .catch(err => console.error(err))
      .finally(() => { setIsLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'session': return { icon: 'calendar', color: '#2563EB', bg: '#DBEAFE' };
      case 'chat': return { icon: 'chatbubble', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'payment': return { icon: 'card', color: '#059669', bg: '#D1FAE5' };
      case 'system': default: return { icon: 'notifications', color: '#F59E0B', bg: '#FEF3C7' };
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const renderNotification = ({ item }) => {
    const config = getTypeConfig(item.type);
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => markRead(item._id)}
      >
        {!item.isRead && <View style={styles.unreadDot} />}
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <Icon name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.isRead && { fontWeight: 'bold' }]}>{item.title}</Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
        )}
      </View>

      {isLoading ? (
        <NotificationsSkeleton />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: 15 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={['#2563EB']} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="notifications-off-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>You'll see updates about sessions, messages, and more here.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1 },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  unreadCard: { backgroundColor: '#EFF6FF', borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  unreadDot: { position: 'absolute', top: 18, left: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, color: '#111827', fontWeight: '600' },
  notifMessage: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 19 },
  notifTime: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
});

export default NotificationsScreen;
