import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { SkeletonBox } from '../../shared/components/Skeleton';

const screenWidth = Dimensions.get('window').width;
const cardSize = (screenWidth - 60) / 2;

const ExercisesScreen = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState({ completedToday: 0, totalExercises: 0, streak: 0, totalPoints: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      Promise.all([
        apiClient.get('/exercises'),
        apiClient.get('/exercises/stats'),
      ])
        .then(([exRes, statsRes]) => {
          if (active) {
            setExercises(exRes.data);
            setStats(statsRes.data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => { if (active) setIsLoading(false); });

      return () => { active = false; };
    }, [])
  );

  const totalCount = stats.totalExercises || exercises.length || 1;
  const progress = totalCount > 0 ? Math.min(stats.completedToday / totalCount, 1) : 0;

  const getExerciseIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'relaxation': return 'leaf';
      case 'focus': return 'eye';
      case 'anxiety': return 'pulse';
      case 'sleep': return 'moon';
      default: return 'fitness';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mental Exercises</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExerciseHistoryScreen')}>
          <Text style={styles.historyBtn}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Progress Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressTitle}>Today's Progress</Text>
              <Text style={styles.progressSub}>{stats.completedToday} of {totalCount} completed</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="flame" size={18} color="#F59E0B" />
              <Text style={styles.statText}>{stats.streak} day streak</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="star" size={18} color="#8B5CF6" />
              <Text style={styles.statText}>{stats.totalPoints} pts</Text>
            </View>
          </View>
        </Animated.View>

        {/* Exercise Grid */}
        {isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((_, idx) => (
              <View key={idx} style={[styles.exerciseCard, { backgroundColor: '#E0E7FF' }]}>
                <SkeletonBox width={48} height={48} radius={14} style={{ marginBottom: 14 }} />
                <SkeletonBox width={100} height={16} style={{ marginBottom: 6 }} />
                <SkeletonBox width={60} height={14} style={{ marginBottom: 10 }} />
                <SkeletonBox width={70} height={20} radius={8} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {exercises.map((item, index) => (
              <Animated.View key={item._id || index} entering={FadeInUp.delay((index + 2) * 100).duration(400)}>
                <TouchableOpacity
                  style={[styles.exerciseCard, { backgroundColor: item.color || '#E0E7FF' }]}
                  onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
                >
                  <View style={styles.cardIconBox}>
                    <Icon name={getExerciseIcon(item.type)} size={28} color={item.textColor || '#4338CA'} />
                  </View>
                  <Text style={[styles.cardTitle, { color: item.textColor || '#1F2937' }]}>{item.title}</Text>
                  <View style={styles.cardMeta}>
                    <Icon name="time-outline" size={14} color={item.textColor || '#6B7280'} style={{ marginRight: 4 }} />
                    <Text style={[styles.cardMetaText, { color: item.textColor || '#6B7280' }]}>{item.duration}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: (item.textColor || '#4338CA') + '20' }]}>
                    <Text style={[styles.typeText, { color: item.textColor || '#4338CA' }]}>{item.type}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  historyBtn: { fontSize: 16, fontWeight: '600', color: '#2563EB' },

  progressCard: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  progressTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  progressSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  progressCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#2563EB' },
  progressPercent: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 15, justifyContent: 'space-between' },
  exerciseCard: { width: cardSize, borderRadius: 20, padding: 18, marginBottom: 0 },
  cardIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardMetaText: { fontSize: 13, fontWeight: '500' },
  typeBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '600' },
});

export default ExercisesScreen;
