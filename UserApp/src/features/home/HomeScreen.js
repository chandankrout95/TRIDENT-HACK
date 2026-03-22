import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Modal, Vibration, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { HomeSkeleton } from '../../shared/components/Skeleton';
import LinearGradient from 'react-native-linear-gradient';
import useWatchSync from '../../hooks/useWatchSync';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { vitals, isSyncing, lastSynced, syncNow, clearData } = useWatchSync();
  const [analytics, setAnalytics] = useState(null);
  const [coachTip, setCoachTip] = useState('');

  // Mood tracker state
  const [todayMoods, setTodayMoods] = useState([]);
  const [moodAvg, setMoodAvg] = useState(null);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [moodSaving, setMoodSaving] = useState(false);
  const [moodCooldown, setMoodCooldown] = useState(0); // seconds remaining
  const moodTimerRef = useRef(null);
  const cooldownRef = useRef(null);
  const lastEntryRef = useRef(null);

  const fetchAnalytics = async () => {
    try {
      const { data } = await apiClient.post('/health/compare');
      setAnalytics(data);
      setCoachTip(data.coach_recommendation || '');
    } catch (err) {
      console.warn('Analytics fetch failed:', err);
    }
  };

  const fetchTodayMoods = async () => {
    try {
      const { data } = await apiClient.get('/mood-tracking/today');
      setTodayMoods(data.moods || []);
      setMoodAvg(data.averageScore);
      lastEntryRef.current = data.lastEntryAt ? new Date(data.lastEntryAt) : null;
      // Calculate remaining cooldown from last entry
      if (data.lastEntryAt) {
        const elapsed = Math.floor((Date.now() - new Date(data.lastEntryAt).getTime()) / 1000);
        const remaining = Math.max(0, 10 * 60 - elapsed);
        if (remaining > 0) {
          setMoodCooldown(remaining);
          startCooldownTick(remaining);
        } else {
          setMoodCooldown(0);
        }
      }
    } catch (err) {
      console.warn('Mood fetch failed:', err);
    }
  };

  const startCooldownTick = (initial) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    let remaining = initial;
    setMoodCooldown(remaining);
    cooldownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
        setMoodCooldown(0);
        setSelectedMood(null);
      } else {
        setMoodCooldown(remaining);
      }
    }, 1000);
  };

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400);
    fetchAnalytics();
    fetchTodayMoods();
    return () => clearTimeout(t);
  }, []);

  // Refetch moods on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchTodayMoods();
    }, [])
  );

  // 10-minute mood prompt timer — triggers when cooldown hits 0
  useEffect(() => {
    if (moodCooldown === 0 && todayMoods.length > 0 && lastEntryRef.current) {
      // Cooldown just ended, show prompt
      setShowMoodPrompt(true);
      Vibration.vibrate(200);
    }
  }, [moodCooldown]);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Refetch analytics after sync
  useEffect(() => {
    if (lastSynced) fetchAnalytics();
  }, [lastSynced]);
 
  // Pulse animation for sync dot
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);
 
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: withTiming(isSyncing ? 1 : 0.6)
  }));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const MOOD_MAP = { 1: 'terrible', 2: 'bad', 3: 'okay', 4: 'good', 5: 'great' };

  const formatCooldown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isMoodLocked = moodCooldown > 0;

  const handleMoodSelect = async (moodId, context = 'manual') => {
    if (moodSaving || isMoodLocked) return;
    setMoodSaving(true);
    try {
      setSelectedMood(moodId);
      await apiClient.post('/mood-tracking', {
        mood: MOOD_MAP[moodId],
        score: moodId,
        context,
      });
      lastEntryRef.current = new Date();
      setShowMoodPrompt(false);
      // Start 10-min cooldown
      startCooldownTick(10 * 60);
      fetchTodayMoods();
    } catch (err) {
      console.error(err);
    } finally {
      setMoodSaving(false);
    }
  };

  // Build chart data from real snapshots
  const getChartData = () => {
    const snaps = analytics?.snapshots || [];
    if (snaps.length === 0) return { labels: ['No Data'], datasets: [{ data: [0] }] };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      labels: snaps.map(s => {
        const d = new Date(s.date);
        return `${dayNames[d.getDay()]} ${d.getDate()}`;
      }),
      datasets: [{ data: snaps.map(s => s.steps || 0) }],
    };
  };

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
            <Text style={styles.greeting}>{greeting()}, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</Text>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Daily Mood Tracker</Text>
            {todayMoods.length > 0 && (
              <View style={styles.moodBadge}>
                <Text style={styles.moodBadgeText}>{todayMoods.length} check-in{todayMoods.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
          {moodAvg && (
            <View style={styles.moodAvgRow}>
              <Icon name="analytics" size={16} color="#6B7280" />
              <Text style={styles.moodAvgText}>Today's average: {moodAvg}/5</Text>
              <Text style={styles.moodPtsText}>+{todayMoods.length * 2} pts</Text>
            </View>
          )}
          <View style={styles.moodRow}>
            {[
              { id: 1, icon: 'sad-outline', label: 'Terrible' },
              { id: 2, icon: 'sad', label: 'Bad' },
              { id: 3, icon: 'happy-outline', label: 'Okay' },
              { id: 4, icon: 'happy', label: 'Good' },
              { id: 5, icon: 'heart-circle', label: 'Great' },
            ].map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodBtn, isMoodLocked && styles.moodBtnLocked, !isMoodLocked && selectedMood === mood.id && styles.moodBtnActive]}
                onPress={() => handleMoodSelect(mood.id)}
                disabled={moodSaving || isMoodLocked}
              >
                <Icon name={mood.icon} size={28} color={isMoodLocked ? '#D1D5DB' : (selectedMood === mood.id ? '#2563EB' : '#9CA3AF')} />
                <Text style={[styles.moodLabel, isMoodLocked && { color: '#D1D5DB' }, !isMoodLocked && selectedMood === mood.id && { color: '#2563EB' }]}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {isMoodLocked && (
            <View style={styles.cooldownRow}>
              <Icon name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.cooldownText}>Next check-in in </Text>
              <Text style={styles.cooldownTimer}>{formatCooldown(moodCooldown)}</Text>
            </View>
          )}
        </View>

        {/* Health Overview from Watch */}
        <View>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Health Overview</Text>
              {lastSynced && (
                <View style={styles.syncStatus}>
                  <Animated.View style={[styles.pulseDot, pulseStyle]} />
                  <Text style={styles.lastSyncedText}>
                    Last synced: {formatDistanceToNow(lastSynced)} ago
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.syncBtn, { backgroundColor: '#EF444420', marginRight: 8 }]} 
                onPress={clearData}
              >
                <Icon name="trash-outline" size={16} color="#EF4444" />
                <Text style={[styles.syncBtnText, { color: '#EF4444' }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]} 
                onPress={() => syncNow(false)}
                disabled={isSyncing}
              >
                <Icon name={isSyncing ? "sync" : "refresh"} size={16} color="#64FFDA" />
                <Text style={styles.syncBtnText}>{isSyncing ? "Syncing..." : "Sync Now"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.healthGrid}>
            {/* Steps Card */}
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIconBox, { backgroundColor: '#64FFDA20' }]}>
                  <Icon name="footsteps" size={20} color="#64FFDA" />
                </View>
                <Icon name="watch-outline" size={14} color="#64FFDA" style={{ opacity: 0.6 }} />
              </View>
              <Text style={styles.healthValue}>{vitals.steps.toLocaleString()}</Text>
              <Text style={styles.healthLabel}>Steps Today</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min((vitals.steps / 10000) * 100, 100)}%`, backgroundColor: '#64FFDA' }]} />
              </View>
            </LinearGradient>
 
            {/* Heart Rate Card */}
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIconBox, { backgroundColor: '#FF6B6B20' }]}>
                  <Icon name="heart" size={20} color="#FF6B6B" />
                </View>
                <Icon name="pulse" size={14} color="#FF6B6B" style={{ opacity: 0.6 }} />
              </View>
              <Text style={[styles.healthValue, { color: '#FF6B6B' }]}>{vitals.heartRate} <Text style={styles.healthUnit}>bpm</Text></Text>
              <Text style={styles.healthLabel}>Heart Rate</Text>
              <Text style={styles.healthSubtext}>Live from Watch</Text>
            </LinearGradient>
 
            {/* Calories Card */}
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIconBox, { backgroundColor: '#F59E0B20' }]}>
                  <Icon name="flame" size={20} color="#F59E0B" />
                </View>
              </View>
              <Text style={[styles.healthValue, { color: '#F59E0B' }]}>{vitals.calories} <Text style={styles.healthUnit}>kcal</Text></Text>
              <Text style={styles.healthLabel}>Calories Burned</Text>
            </LinearGradient>
 
            {/* Sleep Card */}
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIconBox, { backgroundColor: '#A78BFA20' }]}>
                  <Icon name="moon" size={20} color="#A78BFA" />
                </View>
              </View>
              <Text style={[styles.healthValue, { color: '#A78BFA' }]}>{vitals.sleep}</Text>
              <Text style={styles.healthLabel}>Sleep Analysis</Text>
            </LinearGradient>
          </View>
        </View>

        {/* AI Predictors */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mental Health AI Predictors</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {/* AI Sleep Predictor Card */}
            <TouchableOpacity style={[styles.aiCard, { width: screenWidth * 0.75 }]} onPress={() => navigation.navigate('SleepPredictorScreen')}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.aiCardGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <View style={styles.aiCardContent}>
                  <View style={styles.aiIconBox}>
                    <Icon name="sparkles" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.aiCardTitle}>Sleep Predictor</Text>
                    <Text style={styles.aiCardDesc} numberOfLines={2}>
                      Predict potential sleep disorders.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* AI Stress Predictor Card */}
            <TouchableOpacity style={[styles.aiCard, { width: screenWidth * 0.75, marginLeft: 15 }]} onPress={() => navigation.navigate('MoodStressPredictorScreen')}>
              <LinearGradient colors={['#EC4899', '#BE185D']} style={styles.aiCardGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <View style={styles.aiCardContent}>
                  <View style={styles.aiIconBox}>
                    <Icon name="water" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.aiCardTitle}>Stress Analyzer</Text>
                    <Text style={styles.aiCardDesc} numberOfLines={2}>
                      Analyze stress & mood from screen time.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* AI Depression Predictor Card */}
            <TouchableOpacity style={[styles.aiCard, { width: screenWidth * 0.75, marginLeft: 15 }]} onPress={() => navigation.navigate('DepressionPredictorScreen')}>
              <LinearGradient colors={['#0EA5E9', '#0369A1']} style={styles.aiCardGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <View style={styles.aiCardContent}>
                  <View style={styles.aiIconBox}>
                    <Icon name="pulse" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.aiCardTitle}>Depression Analyzer</Text>
                    <Text style={styles.aiCardDesc} numberOfLines={2}>
                      Assess risk based on lifestyle & habits.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Total Activity Graph */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Total Activity</Text>
            {analytics?.performance_score != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                <Icon name="trending-up" size={14} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>Score: {analytics.performance_score}/10</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, marginTop: 4 }}>
            {analytics?.snapshots?.length ? `Real-time steps over ${analytics.snapshots.length} sync${analytics.snapshots.length > 1 ? 's' : ''}` : 'Sync your watch to see real data'}
          </Text>
          {analytics?.metric_breakdown && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {Object.entries(analytics.metric_breakdown).map(([key, val]) => (
                <View key={key} style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>{val}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ alignItems: 'center', marginTop: 5, marginLeft: -20 }}>
            <LineChart
              data={getChartData()}
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

        {/* AI Coach Recommendation */}
        {coachTip ? (
          <View style={[styles.card, { backgroundColor: '#1E1B4B' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#312E81', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Icon name="sparkles" size={18} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#E9EDEF' }}>AI Coach</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 20 }}>{coachTip}</Text>
          </View>
        ) : null}

        {/* Wellness Tracker */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => navigation.navigate('WellnessTrackerScreen')}>
            <Text style={styles.cardTitle}>Wellness Tracker</Text>
            <Icon name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
          {wellnessActivities.map((act, i) => (
            <TouchableOpacity key={i} style={styles.wellnessRow} onPress={() => navigation.navigate('WellnessTrackerScreen')}>
              <View style={[styles.wellnessIcon, { backgroundColor: act.color + '18' }]}>
                <Icon name={act.icon} size={22} color={act.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wellnessTitle}>{act.title}</Text>
                <Text style={styles.wellnessValue}>{act.value}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Goals */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WellnessTrackerScreen')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.cardTitle}>Daily Goals</Text>
            <Icon name="chevron-forward" size={20} color="#D1D5DB" />
          </View>
          <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }}>Track your daily habits and goals</Text>
          <View style={styles.taskItem}>
            <Icon name="list" size={24} color="#2563EB" style={{ marginRight: 10 }} />
            <Text style={styles.taskText}>Check your custom daily goals</Text>
          </View>
        </TouchableOpacity>

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

      {/* 10-Minute Mood Prompt Modal */}
      <Modal visible={showMoodPrompt} transparent animationType="slide">
        <View style={styles.moodModalOverlay}>
          <View style={styles.moodModalCard}>
            <View style={styles.moodModalHandle} />
            <Icon name="happy-outline" size={48} color="#2563EB" style={{ marginBottom: 12 }} />
            <Text style={styles.moodModalTitle}>Quick Mood Check-in</Text>
            <Text style={styles.moodModalSub}>How are you feeling right now? (+2 pts)</Text>
            <View style={styles.moodModalRow}>
              {[
                { id: 1, icon: 'sad-outline', label: 'Terrible' },
                { id: 2, icon: 'sad', label: 'Bad' },
                { id: 3, icon: 'happy-outline', label: 'Okay' },
                { id: 4, icon: 'happy', label: 'Good' },
                { id: 5, icon: 'heart-circle', label: 'Great' },
              ].map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.moodModalBtn}
                  onPress={() => handleMoodSelect(m.id, 'prompt')}
                  disabled={moodSaving}
                >
                  <Icon name={m.icon} size={32} color="#374151" />
                  <Text style={styles.moodModalLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.moodModalSkip} onPress={() => setShowMoodPrompt(false)}>
              <Text style={styles.moodModalSkipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
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
  moodBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  moodBadgeText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  moodAvgRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  moodAvgText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  moodPtsText: { fontSize: 12, color: '#10B981', fontWeight: '700', marginLeft: 'auto' },
  moodBtnLocked: { backgroundColor: '#F3F4F6', opacity: 0.6 },
  cooldownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingVertical: 8, backgroundColor: '#F9FAFB', borderRadius: 12 },
  cooldownText: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginLeft: 6 },
  cooldownTimer: { fontSize: 15, fontWeight: '800', color: '#2563EB', fontVariant: ['tabular-nums'] },

  // Mood Prompt Modal
  moodModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  moodModalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, alignItems: 'center' },
  moodModalHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 20 },
  moodModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  moodModalSub: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  moodModalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  moodModalBtn: { alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#F3F4F6', flex: 1, marginHorizontal: 4 },
  moodModalLabel: { fontSize: 11, color: '#6B7280', marginTop: 6, fontWeight: '600' },
  moodModalSkip: { paddingVertical: 12 },
  moodModalSkipText: { fontSize: 15, color: '#9CA3AF', fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 5, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  syncStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#64FFDA', marginRight: 6 },
  lastSyncedText: { fontSize: 11, color: '#6B7280' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6 },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#64FFDA', fontSize: 12, fontWeight: '700' },
 
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 15, justifyContent: 'space-between' },
  healthCard: { width: '48%', minHeight: 140, borderRadius: 24, padding: 18, marginBottom: 0, justifyContent: 'space-between' },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  healthIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  healthValue: { fontSize: 24, fontWeight: '800', color: '#64FFDA', marginTop: 12 },
  healthUnit: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  healthLabel: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  healthSubtext: { fontSize: 10, color: '#475569', marginTop: 4 },
  progressContainer: { height: 4, backgroundColor: '#1E293B', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },

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

  aiCard: { marginHorizontal: 20, marginBottom: 15, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  aiCardGradient: { padding: 20 },
  aiCardContent: { flexDirection: 'row', alignItems: 'center' },
  aiIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  aiCardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
});

export default HomeScreen;
