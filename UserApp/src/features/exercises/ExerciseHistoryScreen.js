import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SkeletonBox, SkeletonCircle } from '../../shared/components/Skeleton';

// ─── Inline skeleton for exercise history cards ──────────────────────────────
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

const ExerciseHistoryScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Mock history data
  const historyData = [
    { id: '1', title: 'Deep Breathing', duration: '5 min', date: 'Today, 10:30 AM', color: '#166534', bg: '#DCFCE7', icon: 'leaf' },
    { id: '2', title: 'Stress Relief Scan', duration: '15 min', date: 'Yesterday, 08:15 PM', color: '#9D174D', bg: '#FCE7F3', icon: 'pulse' },
    { id: '3', title: 'Guided Meditation', duration: '10 min', date: 'Mon, 07:00 AM', color: '#92400E', bg: '#FEF3C7', icon: 'eye' },
    { id: '4', title: 'Sleep Visualization', duration: '20 min', date: 'Sun, 10:45 PM', color: '#3730A3', bg: '#E0E7FF', icon: 'moon' },
    { id: '5', title: 'Focus Builder', duration: '8 min', date: 'Fri, 02:20 PM', color: '#9A3412', bg: '#FFF7ED', icon: 'fitness' },
  ];

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Icon name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.duration}>{item.duration}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.checkBadge}>
        <Icon name="checkmark-circle" size={24} color="#10B981" />
      </View>
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
          data={historyData}
          keyExtractor={item => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
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
  checkBadge: { marginLeft: 10 },
});

export default ExerciseHistoryScreen;
