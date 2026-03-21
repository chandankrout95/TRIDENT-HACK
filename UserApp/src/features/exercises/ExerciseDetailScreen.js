import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ExerciseDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const exercise = route?.params?.exercise || {};
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const durationMin = parseInt(exercise.duration) || 5;
  const totalSec = durationMin * 60;
  const progress = totalSec > 0 ? Math.min(seconds / totalSec, 1) : 0;

  useEffect(() => {
    let interval;
    if (isRunning && seconds < totalSec) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds, totalSec]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getExerciseIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'relaxation': return 'leaf';
      case 'focus': return 'eye';
      case 'anxiety': return 'pulse';
      case 'sleep': return 'moon';
      default: return 'fitness';
    }
  };

  const getSteps = (type) => {
    switch (type?.toLowerCase()) {
      case 'relaxation': return [
        'Find a comfortable seated position',
        'Close your eyes and take a deep breath',
        'Inhale slowly through your nose for 4 seconds',
        'Hold your breath for 7 seconds',
        'Exhale slowly through your mouth for 8 seconds',
        'Repeat the cycle for the full duration',
      ];
      case 'focus': return [
        'Sit in a quiet space with minimal distractions',
        'Focus your gaze on a single point or close your eyes',
        'Bring your attention to your breath',
        'When your mind wanders, gently return focus',
        'Observe thoughts without judgment, let them pass',
        'Maintain focus for the entire session',
      ];
      case 'anxiety': return [
        'Lie down or sit comfortably',
        'Close your eyes and take three deep breaths',
        'Focus your attention on your toes, noticing any tension',
        'Slowly move your attention upward through your body',
        'Release tension in each area as you go',
        'Finish by taking three slow, calming breaths',
      ];
      case 'sleep': return [
        'Dim the lights and lie in bed',
        'Close your eyes and breathe deeply',
        'Imagine a peaceful, calm environment',
        'Visualize each detail: colors, sounds, sensations',
        'Let your body feel heavy and relaxed',
        'Continue breathing slowly as you drift off',
      ];
      default: return ['Follow the guided instructions', 'Stay focused and breathe deeply'];
    }
  };

  const steps = getSteps(exercise.type);

  return (
    <View style={[styles.container, { backgroundColor: exercise.color || '#E0E7FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color={exercise.textColor || '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: exercise.textColor || '#111827' }]}>Exercise</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
            <Icon name={getExerciseIcon(exercise.type)} size={48} color={exercise.textColor || '#4338CA'} />
          </View>
          <Text style={[styles.heroTitle, { color: exercise.textColor || '#111827' }]}>{exercise.title}</Text>
          <Text style={[styles.heroDuration, { color: exercise.textColor || '#6B7280' }]}>{exercise.duration} • {exercise.type}</Text>
        </Animated.View>

        {/* Timer */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.timerCard}>
          <Text style={styles.timerLabel}>Session Timer</Text>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          <View style={styles.timerBarBg}>
            <View style={[styles.timerBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timerSub}>{formatTime(totalSec - seconds)} remaining</Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How to Perform</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.benefitsCard}>
          <Text style={styles.stepsTitle}>Benefits</Text>
          {['Reduces stress and anxiety', 'Improves focus and clarity', 'Promotes better sleep quality', 'Builds emotional resilience'].map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Icon name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        {seconds > 0 && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setIsRunning(false); setSeconds(0); }}>
            <Icon name="refresh" size={22} color="#6B7280" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.playBtn, isRunning && styles.pauseBtn]}
          onPress={() => setIsRunning(!isRunning)}
        >
          <Icon name={isRunning ? 'pause' : 'play'} size={28} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.playBtnText}>{isRunning ? 'Pause' : seconds > 0 ? 'Resume' : 'Start Exercise'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  heroSection: { alignItems: 'center', paddingVertical: 30 },
  heroIcon: { width: 90, height: 90, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  heroDuration: { fontSize: 16, opacity: 0.8 },

  timerCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  timerLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  timerText: { fontSize: 48, fontWeight: 'bold', color: '#111827', fontVariant: ['tabular-nums'] },
  timerBarBg: { width: '100%', height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 15, overflow: 'hidden' },
  timerBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  timerSub: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },

  stepsCard: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  stepsTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { fontSize: 14, fontWeight: 'bold', color: '#2563EB' },
  stepText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },

  benefitsCard: { marginHorizontal: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitText: { fontSize: 15, color: '#374151' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', gap: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  resetBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  playBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  pauseBtn: { backgroundColor: '#F59E0B' },
  playBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default ExerciseDetailScreen;
