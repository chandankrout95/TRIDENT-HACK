import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import Skeleton from '../../components/common/Skeleton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const { data } = await apiClient.get('/notifications/my');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getIconData = (type) => {
    switch (type) {
      case 'session': return { name: 'calendar', color: '#10B981', bg: '#D1FAE5' };
      case 'chat': return { name: 'chatbubble', color: '#3B82F6', bg: '#DBEAFE' };
      case 'payment': return { name: 'card', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { name: 'information-circle', color: '#6366F1', bg: '#E0E7FF' };
    }
  };

  const renderNotification = ({ item, index }) => {
    const iconData = getIconData(item.type);
    return (
      <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
        <TouchableOpacity
          style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
          onPress={() => {
            if (!item.isRead) markAsRead(item._id);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
            <Icon name={iconData.name} size={24} color={iconData.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.timeLabel}>
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.list}>
      {[1, 2, 3, 4, 5].map((_, i) => (
        <View key={i} style={styles.notificationCard}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={[styles.textContainer, { marginLeft: 15 }]}>
            <Skeleton width={150} height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {isLoading ? renderSkeleton() : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="notifications-off-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>You're all caught up! New notifications will appear here.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

  list: { padding: 16 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  unreadCard: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#CCFBF1' },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  unreadText: { fontWeight: '800', color: '#111827' },
  message: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  timeLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8, fontWeight: '500' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', alignSelf: 'center', marginLeft: 10 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: '40%' },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});

export default NotificationScreen;
