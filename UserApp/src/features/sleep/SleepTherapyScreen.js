import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
  Animated, Easing, ActivityIndicator, Alert, Dimensions, NativeModules, DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

const { BinauralBeatPlayer } = NativeModules;

const MOODS = [
  { id: 'stressed', icon: '😰', label: 'Stressed' },
  { id: 'anxious', icon: '😟', label: 'Anxious' },
  { id: 'tired', icon: '😴', label: 'Tired' },
  { id: 'neutral', icon: '😐', label: 'Neutral' },
  { id: 'calm', icon: '😌', label: 'Calm' },
];

const GOALS = [
  { id: 'fall_asleep', icon: 'moon', label: 'Fall Asleep', color: '#6366F1' },
  { id: 'deep_sleep', icon: 'bed', label: 'Deep Sleep', color: '#8B5CF6' },
  { id: 'power_nap', icon: 'timer', label: 'Power Nap', color: '#0EA5E9' },
  { id: 'relax', icon: 'leaf', label: 'Relax', color: '#10B981' },
];

const SOUNDS = [
  { id: 'rain', icon: 'rainy', label: 'Rain', color: '#60A5FA' },
  { id: 'forest', icon: 'leaf', label: 'Forest', color: '#34D399' },
  { id: 'ocean', icon: 'water', label: 'Ocean', color: '#38BDF8' },
  { id: 'wind', icon: 'cloudy', label: 'Wind', color: '#94A3B8' },
  { id: 'brown_noise', icon: 'radio', label: 'Brown', color: '#A78BFA' },
  { id: 'pink_noise', icon: 'musical-notes', label: 'Pink', color: '#F472B6' },
];

const DURATIONS = [15, 20, 30, 45, 60];

const SleepTherapyScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(s => s.auth);

  // Setup state
  const [mood, setMood] = useState(null);
  const [goal, setGoal] = useState(null);
  const [sound, setSound] = useState('rain');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0.8)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.6)).current;
  const pulseAnim3 = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // ─── Generate Session ────────────────────────────────────────────────────
  const generateSession = async () => {
    if (!mood || !goal) {
      Alert.alert('Missing Info', 'Please select your mood and sleep goal.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiClient.post('/sleep-therapy/generate-session', {
        mood,
        sleepGoal: goal,
        soundPreference: sound,
        duration,
        vitals: { heartRate: 72, steps: 8000, sleep: '7h' },
      });

      setSessionData(res.data);
      setSessionActive(true);
      setElapsed(0);
      elapsedRef.current = 0;
      setIsPaused(false);

      // Start native audio engine
      const baseFreq = res.data.baseFrequency || 200;
      const offset = res.data.binauralOffset || 3;
      try {
        await BinauralBeatPlayer.start(baseFreq, offset, 0.4, sound, 0.35);
      } catch (audioErr) {
        console.warn('Audio start failed:', audioErr);
      }

      // Notify mini-player
      const goalLabel = GOALS.find(g => g.id === goal)?.label || 'Sleep';
      DeviceEventEmitter.emit('sleepSessionStarted', { goal: goalLabel, sound });
    } catch (err) {
      console.error('Session generation failed:', err);
      Alert.alert('Error', 'Could not generate session. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Session Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        const e = elapsedRef.current;
        setElapsed(e);
        // Emit tick outside of setState to avoid cross-component render errors
        setTimeout(() => DeviceEventEmitter.emit('sleepSessionTick', { elapsed: e }), 0);
        if (e >= duration * 60) {
          clearInterval(timerRef.current);
          completeSession();
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive, isPaused, duration]);

  // Listen for external stop (from mini-player)
  useEffect(() => {
    const stopSub = DeviceEventEmitter.addListener('sleepSessionStopped', () => {
      clearInterval(timerRef.current);
      setSessionActive(false);
    });
    const pauseSub = DeviceEventEmitter.addListener('sleepSessionPaused', () => {
      setIsPaused(p => !p);
    });
    return () => { stopSub.remove(); pauseSub.remove(); };
  }, []);

  // ─── Animations ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionActive || isPaused) return;

    const beatHz = sessionData?.binauralOffset || 3;
    const pulseDuration = 1000 / beatHz * 2;

    // Multiple concentric pulse rings
    const pulse1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim1, { toValue: 1, duration: pulseDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim1, { toValue: 0.8, duration: pulseDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim2, { toValue: 1, duration: pulseDuration * 1.3, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim2, { toValue: 0.6, duration: pulseDuration * 1.3, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const pulse3 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim3, { toValue: 0.9, duration: pulseDuration * 1.6, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim3, { toValue: 0.4, duration: pulseDuration * 1.6, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Slow rotation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    );

    // Breathing guide
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.08, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    pulse1.start(); pulse2.start(); pulse3.start(); rotate.start(); breathe.start();

    return () => { pulse1.stop(); pulse2.stop(); pulse3.stop(); rotate.stop(); breathe.stop(); };
  }, [sessionActive, isPaused, sessionData]);

  const completeSession = async () => {
    clearInterval(timerRef.current);
    try { await BinauralBeatPlayer.stop(); } catch { }
    setSessionActive(false);
    DeviceEventEmitter.emit('sleepSessionStopped');
    if (sessionData?.sessionId) {
      try {
        await apiClient.post('/sleep-therapy/complete-session', { sessionId: sessionData.sessionId });
      } catch { }
    }
    Alert.alert('Session Complete 🌙', 'Sweet dreams! Your sleep therapy session has ended.');
  };

  const stopSession = () => {
    Alert.alert('End Session?', 'Are you sure you want to stop the therapy?', [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'Stop', style: 'destructive', onPress: async () => {
          clearInterval(timerRef.current);
          try { await BinauralBeatPlayer.stop(); } catch { }
          setSessionActive(false);
          DeviceEventEmitter.emit('sleepSessionStopped');
        },
      },
    ]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? elapsed / (duration * 60) : 0;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ─── Session Active View ────────────────────────────────────────────────
  if (sessionActive) {
    const goalColor = GOALS.find(g => g.id === goal)?.color || '#6366F1';

    return (
      <View style={styles.sessionRoot}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Top bar */}
        <View style={styles.sessionTopBar}>
          <TouchableOpacity onPress={stopSession}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.sessionTimer}>{formatTime(elapsed)}</Text>
          <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
            <Icon name={isPaused ? 'play' : 'pause'} size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Center Visualizer */}
        <View style={styles.visualizerContainer}>
          {/* Outer pulse rings */}
          <Animated.View style={[styles.pulseRing, styles.ring3, { opacity: pulseAnim3, transform: [{ scale: pulseAnim3.interpolate({ inputRange: [0.4, 0.9], outputRange: [1.4, 1.8] }) }], borderColor: goalColor + '15' }]} />
          <Animated.View style={[styles.pulseRing, styles.ring2, { opacity: pulseAnim2, transform: [{ scale: pulseAnim2.interpolate({ inputRange: [0.6, 1], outputRange: [1.2, 1.5] }) }], borderColor: goalColor + '25' }]} />
          <Animated.View style={[styles.pulseRing, styles.ring1, { opacity: pulseAnim1, transform: [{ scale: pulseAnim1.interpolate({ inputRange: [0.8, 1], outputRange: [1, 1.2] }) }], borderColor: goalColor + '40' }]} />

          {/* Center orb */}
          <Animated.View style={[styles.centerOrb, { backgroundColor: goalColor + '30', transform: [{ scale: breatheAnim }, { rotate: spin }] }]}>
            <LinearGradient colors={[goalColor + '60', goalColor + '20']} style={styles.orbGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Icon name="moon" size={42} color={goalColor} />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Frequency info */}
        <View style={styles.freqInfo}>
          <Text style={styles.freqTitle}>{sessionData?.sessionInsight || 'Binaural beats active'}</Text>
          <View style={styles.freqRow}>
            <View style={styles.freqChip}>
              <Text style={styles.freqChipLabel}>Base</Text>
              <Text style={[styles.freqChipValue, { color: goalColor }]}>{sessionData?.baseFrequency || 200} Hz</Text>
            </View>
            <View style={styles.freqChip}>
              <Text style={styles.freqChipLabel}>Beat</Text>
              <Text style={[styles.freqChipValue, { color: goalColor }]}>{sessionData?.binauralOffset || 3} Hz</Text>
            </View>
            <View style={styles.freqChip}>
              <Text style={styles.freqChipLabel}>Sound</Text>
              <Text style={[styles.freqChipValue, { color: goalColor }]}>{sound}</Text>
            </View>
          </View>
        </View>

        {/* AI Tip */}
        {sessionData?.personalizedTip && (
          <View style={styles.tipCard}>
            <Icon name="sparkles" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>{sessionData.personalizedTip}</Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: goalColor }]} />
        </View>
        <Text style={styles.remainingText}>{formatTime(duration * 60 - elapsed)} remaining</Text>

        {/* Stop button */}
        <TouchableOpacity style={[styles.stopBtn, { borderColor: goalColor }]} onPress={stopSession}>
          <Icon name="stop-circle" size={24} color={goalColor} />
          <Text style={[styles.stopBtnText, { color: goalColor }]}>End Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Setup View ─────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar translucent={false} backgroundColor="#0A0E14" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌙 Sleep Therapy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <LinearGradient colors={['#1E1B4B', '#0F172A']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon name="moon" size={36} color="#818CF8" />
          <Text style={styles.heroTitle}>AI Brainwave Sleep Therapy</Text>
          <Text style={styles.heroDesc}>Personalized binaural beats tuned to your body and mind</Text>
        </LinearGradient>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.moodBtn, mood === m.id && styles.moodBtnActive]}
                onPress={() => setMood(m.id)}
              >
                <Text style={styles.moodEmoji}>{m.icon}</Text>
                <Text style={[styles.moodLabel, mood === m.id && { color: '#818CF8' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sleep Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Goal</Text>
          <View style={styles.goalRow}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalBtn, goal === g.id && { borderColor: g.color, backgroundColor: g.color + '15' }]}
                onPress={() => setGoal(g.id)}
              >
                <Icon name={g.icon} size={24} color={goal === g.id ? g.color : '#64748B'} />
                <Text style={[styles.goalLabel, goal === g.id && { color: g.color }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ambient Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambient Sound</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SOUNDS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.soundChip, sound === s.id && { borderColor: s.color, backgroundColor: s.color + '15' }]}
                onPress={() => setSound(s.id)}
              >
                <Icon name={s.icon} size={20} color={sound === s.id ? s.color : '#64748B'} />
                <Text style={[styles.soundLabel, sound === s.id && { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durBtn, duration === d && styles.durBtnActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.durText, duration === d && styles.durTextActive]}>{d}</Text>
                <Text style={[styles.durUnit, duration === d && styles.durTextActive]}>min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, (!mood || !goal) && { opacity: 0.5 }]}
          onPress={generateSession}
          disabled={isGenerating || !mood || !goal}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.startBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="play" size={24} color="#FFF" />
                <Text style={styles.startBtnText}>Start Sleep Therapy</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0E14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#0A0E14' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#E9EDEF' },

  hero: { marginHorizontal: 20, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#E9EDEF', marginTop: 12 },
  heroDesc: { fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#CBD5E1', marginBottom: 12 },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#1E293B', flex: 1, marginHorizontal: 3 },
  moodBtnActive: { backgroundColor: '#1E1B4B', borderWidth: 1.5, borderColor: '#818CF8' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },

  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalBtn: { width: '47%', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#1E293B', borderWidth: 1.5, borderColor: '#1E293B' },
  goalLabel: { fontSize: 14, color: '#64748B', marginLeft: 10, fontWeight: '600' },

  soundChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, backgroundColor: '#1E293B', marginRight: 10, borderWidth: 1.5, borderColor: '#1E293B' },
  soundLabel: { fontSize: 13, color: '#64748B', marginLeft: 8, fontWeight: '600' },

  durationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  durBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, marginHorizontal: 4, borderRadius: 14, backgroundColor: '#1E293B' },
  durBtnActive: { backgroundColor: '#312E81', borderWidth: 1.5, borderColor: '#818CF8' },
  durText: { fontSize: 18, fontWeight: 'bold', color: '#64748B' },
  durUnit: { fontSize: 10, color: '#64748B', marginTop: 2 },
  durTextActive: { color: '#818CF8' },

  startBtn: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 12 },
  startBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  startBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  // ─── Session Styles ─────────────────────────────────────────────────────
  sessionRoot: { flex: 1, backgroundColor: '#050810', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 50 },
  sessionTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 24, paddingTop: 10 },
  sessionTimer: { fontSize: 22, fontWeight: '700', color: '#E9EDEF', fontVariant: ['tabular-nums'] },

  visualizerContainer: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderRadius: 999, borderWidth: 2 },
  ring1: { width: 200, height: 200 },
  ring2: { width: 240, height: 240 },
  ring3: { width: 280, height: 280 },
  centerOrb: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  orbGradient: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },

  freqInfo: { alignItems: 'center', paddingHorizontal: 20 },
  freqTitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 12 },
  freqRow: { flexDirection: 'row', gap: 12 },
  freqChip: { alignItems: 'center', backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  freqChipLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  freqChipValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 24, gap: 8 },
  tipText: { fontSize: 13, color: '#CBD5E1', flex: 1 },

  progressBarContainer: { width: SCREEN_W - 48, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden', marginHorizontal: 24 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  remainingText: { fontSize: 12, color: '#64748B', marginTop: 6 },

  stopBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28, gap: 8, marginBottom: 10 },
  stopBtnText: { fontSize: 15, fontWeight: '600' },
});

export default SleepTherapyScreen;
