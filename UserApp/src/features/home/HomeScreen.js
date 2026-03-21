import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { HomeSkeleton } from '../../shared/components/Skeleton';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const handleMoodSelect = async (moodId, stringVal) => {
    try {
      setSelectedMood(moodId);
      await apiClient.post('/user/mood', { mood: stringVal, score: moodId });
    } catch (err) { console.error(err); }
  };

  const activityData = [
    { day: 'Mon', score: 40 },
    { day: 'Tue', score: 65 },
    { day: 'Wed', score: 30 },
    { day: 'Thu', score: 85 },
    { day: 'Fri', score: 70 },
    { day: 'Sat', score: 95 },
    { day: 'Sun', score: 55 },
  ];

  const healthStats = [
    { icon: 'heart', color: '#EF4444', bg: '#FEE2E2', value: '72', unit: 'bpm', label: 'Heart Rate' },
    { icon: 'moon', color: '#6366F1', bg: '#EDE9FE', value: '7.5', unit: 'hrs', label: 'Sleep' },
    { icon: 'footsteps', color: '#2563EB', bg: '#DBEAFE', value: '8,432', unit: '', label: 'Steps' },
    { icon: 'flame', color: '#F97316', bg: '#FFF7ED', value: '342', unit: 'kcal', label: 'Calories' },
  ];

  const wellnessActivities = [
    { icon: 'water', color: '#0EA5E9', title: 'Hydration', value: '6/8 glasses' },
    { icon: 'walk', color: '#10B981', title: 'Active Minutes', value: '45 min' },
    { icon: 'sunny', color: '#F59E0B', title: 'Vitamin D', value: '15 min outdoor' },
    { icon: 'body', color: '#8B5CF6', title: 'Posture Check', value: '3 reminders' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.profileIconBtn}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Icon name="person" size={22} color="#2563EB" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.subtitle}>How are you feeling today?</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { marginRight: 10 }]}
            onPress={() => navigation.navigate('ScannerScreen')}
          >
            <Icon name="scan-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('NotificationsScreen')}
          >
            <Icon name="notifications-outline" size={24} color="#374151" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}>
        {isLoading ? (
          <HomeSkeleton />
        ) : (
          <>
        {/* Mood Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Mood Tracker</Text>
          <View style={styles.moodRow}>
            {[
              { id: 1, icon: 'sad-outline', label: 'Bad' },
              { id: 2, icon: 'sad', label: 'Low' },
              { id: 3, icon: 'happy-outline', label: 'OK' },
              { id: 4, icon: 'happy', label: 'Good' },
              { id: 5, icon: 'heart-circle', label: 'Great' },
            ].map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodBtn, selectedMood === mood.id && styles.moodBtnActive]}
                onPress={() => handleMoodSelect(mood.id, mood.id.toString())}
              >
                <Icon name={mood.icon} size={28} color={selectedMood === mood.id ? '#2563EB' : '#9CA3AF'} />
                <Text style={[styles.moodLabel, selectedMood === mood.id && { color: '#2563EB' }]}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Overview from Watch */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Overview</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <View style={styles.healthGrid}>
            {healthStats.map((stat, i) => (
              <View key={i} style={[styles.healthCard, { backgroundColor: stat.bg }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={[styles.healthIconBox, { backgroundColor: stat.color + '20' }]}>
                    <Icon name={stat.icon} size={22} color={stat.color} />
                  </View>
                  <Icon name="cellular-outline" size={14} color={stat.color} style={{ opacity: 0.6 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <Text style={styles.healthValue}>{stat.value}<Text style={styles.healthUnit}> {stat.unit}</Text></Text>
                  <Text style={styles.healthLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Total Activity Graph */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Activity</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 15, marginTop: 4 }}>AI-Analyzed engagement over 7 days</Text>
          <View style={{ alignItems: 'center', marginTop: 15, marginLeft: -20 }}>
            <LineChart
              data={{
                labels: activityData.map(d => d.day),
                datasets: [{ data: activityData.map(d => d.score) }]
              }}
              width={screenWidth - 40}
              height={180}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563EB', fill: '#FFF' },
                propsForBackgroundLines: { stroke: '#F3F4F6' }
              }}
              bezier
              withVerticalLines={false}
              style={{ borderRadius: 16 }}
            />
          </View>
        </View>

        {/* Wellness Tracker */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Wellness Tracker</Text>
          </View>
          {wellnessActivities.map((act, i) => (
            <View key={i} style={styles.wellnessRow}>
              <View style={[styles.wellnessIcon, { backgroundColor: act.color + '18' }]}>
                <Icon name={act.icon} size={22} color={act.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wellnessTitle}>{act.title}</Text>
                <Text style={styles.wellnessValue}>{act.value}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#D1D5DB" />
            </View>
          ))}
        </View>

        {/* Daily Goals */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.cardTitle}>Daily Goals</Text>
            <TouchableOpacity><Icon name="add-circle" size={24} color="#2563EB" /></TouchableOpacity>
          </View>
          {[
            { id: 1, text: 'Drink 2L of water', completed: true },
            { id: 2, text: '10 min mindfulness meditation', completed: false },
            { id: 3, text: 'Read a chapter of a book', completed: false },
            { id: 4, text: 'Take a 20 min walk', completed: true },
          ].map(task => (
            <View key={task.id} style={styles.taskItem}>
              <Icon name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.completed ? "#10B981" : "#D1D5DB"} style={{ marginRight: 10 }} />
              <Text style={[styles.taskText, task.completed && { textDecorationLine: 'line-through', color: '#9CA3AF' }]}>{task.text}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SearchScreen')}>
              <Icon name="search" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionText}>Find Therapist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => navigation.navigate('Sessions')}>
              <Icon name="calendar-outline" size={20} color="#1D4ED8" style={{ marginRight: 8 }} />
              <Text style={styles.actionTextSecondary}>My Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  profileIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2563EB' },
  headerIconBtn: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 14, position: 'relative' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },

  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 0 },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  moodBtn: { alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: '#F9FAFB' },
  moodBtnActive: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#2563EB' },
  moodLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 5, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  seeAll: { fontSize: 14, color: '#2563EB', fontWeight: '600' },

  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 15, justifyContent: 'space-between' },
  healthCard: { width: '48%', height: 130, borderRadius: 20, padding: 16, marginBottom: 0, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  healthIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  healthValue: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  healthUnit: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  healthLabel: { fontSize: 14, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  wellnessRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  wellnessIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  wellnessTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  wellnessValue: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, marginBottom: 8 },
  taskText: { fontSize: 15, color: '#111827', flex: 1 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  actionBtnSecondary: { backgroundColor: '#DBEAFE', shadowColor: '#DBEAFE' },
  actionTextSecondary: { color: '#1D4ED8', fontSize: 15, fontWeight: '600' },
});

export default HomeScreen;
