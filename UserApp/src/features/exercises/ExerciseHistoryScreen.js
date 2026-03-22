import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { SkeletonBox, SkeletonCircle } from '../../shared/components/Skeleton';

const HistoryCardSkel = () => (
  <View style={styles.historyCard}>
    <SkeletonCircle size={48} style={{ borderRadius: 14, marginRight: 14 }} />
    <View style={{ flex: 1 }}>
      <SkeletonBox width="55%" height={13} radius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox width="72%" height={10} radius={5} />
    </View>
    <SkeletonBox width={24} height={24} radius={12} />
  </View>
);

const getIconForType = (type) => {
  switch (type?.toLowerCase()) {
    case 'relaxation': return { icon: 'leaf', color: '#166534', bg: '#DCFCE7' };
    case 'focus': return { icon: 'eye', color: '#92400E', bg: '#FEF3C7' };
    case 'anxiety': return { icon: 'pulse', color: '#9D174D', bg: '#FCE7F3' };
    case 'sleep': return { icon: 'moon', color: '#3730A3', bg: '#E0E7FF' };
    default: return { icon: 'fitness', color: '#9A3412', bg: '#FFF7ED' };
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (day.getTime() === today.getTime()) return `Today, ${time}`;
  if (day.getTime() === yesterday.getTime()) return `Yesterday, ${time}`;

  const weekday = date.toLocaleDateString([], { weekday: 'short' });
  return `${weekday}, ${time}`;
};

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  if (m < 1) return `${seconds}s`;
  return `${m} min`;
};

const ExerciseHistoryScreen = () => {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      apiClient.get('/exercises/history')
        .then(res => { if (active) setHistory(res.data); })
        .catch(err => console.error(err))
        .finally(() => { if (active) setIsLoading(false); });

      return () => { active = false; };
    }, [])
  );

  const renderHistoryItem = ({ item, index }) => {
    const { icon, color, bg } = getIconForType(item.exerciseType);
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
        <View style={styles.historyCard}>
          <View style={[styles.iconBox, { backgroundColor: bg }]}>
            <Icon name={icon} size={24} color={color} />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.title}>{item.exerciseTitle}</Text>
            <View style={styles.metaRow}>
              <Icon name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.duration}>{formatDuration(item.durationSeconds)}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{item.pointsEarned}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="barbell-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No exercises yet</Text>
      <Text style={styles.emptySubtitle}>Complete your first exercise to see it here!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise History</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          <HistoryCardSkel />
          <HistoryCardSkel />
          <HistoryCardSkel />
          <HistoryCardSkel />
          <HistoryCardSkel />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoBox: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  duration: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  dot: { fontSize: 13, color: '#D1D5DB', marginHorizontal: 6 },
  date: { fontSize: 13, color: '#6B7280' },
  pointsBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 10 },
  pointsText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#6B7280', marginTop: 16 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', marginTop: 6 },
});

export default ExerciseHistoryScreen;
