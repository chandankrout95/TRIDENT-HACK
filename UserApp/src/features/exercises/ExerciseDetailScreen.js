import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Vibration } from 'react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';

const RING_SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ExerciseDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const exercise = route?.params?.exercise || {};

  const durationMin = parseInt(exercise.duration) || 5;
  const totalSec = durationMin * 60;

  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(totalSec);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const elapsed = totalSec - secondsLeft;
  const progress = totalSec > 0 ? elapsed / totalSec : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Timer logic
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleComplete(totalSec);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleComplete = async (actualDuration) => {
    if (isCompleted || isSaving) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post('/exercises/complete', {
        exerciseId: exercise._id,
        durationSeconds: actualDuration || elapsed,
      });
      setEarnedPoints(res.data.pointsEarned);
      setTotalPoints(res.data.totalPoints);
      setStreak(res.data.streak);
      setIsCompleted(true);
      setShowModal(true);
      Vibration.vibrate([0, 100, 50, 100]);
    } catch (err) {
      console.error('Error completing exercise:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualComplete = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(0);
    handleComplete(elapsed);
  };

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

  // Determine which step to highlight based on progress
  const activeStep = Math.min(Math.floor(progress * steps.length), steps.length - 1);

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

        {/* Circular Timer */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.timerCard}>
          <Text style={styles.timerLabel}>SESSION TIMER</Text>
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#E5E7EB"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={isCompleted ? '#10B981' : '#2563EB'}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            <View style={styles.ringCenter}>
              {isCompleted ? (
                <Icon name="checkmark-circle" size={48} color="#10B981" />
              ) : (
                <>
                  <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
                  <Text style={styles.timerSub}>remaining</Text>
                </>
              )}
            </View>
          </View>
          {!isCompleted && elapsed > 0 && (
            <Text style={styles.elapsedText}>{formatTime(elapsed)} elapsed</Text>
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.completedText}>Completed! +{earnedPoints} pts</Text>
            </View>
          )}
        </Animated.View>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How to Perform</Text>
          {steps.map((step, i) => {
            const isActive = isRunning && i === activeStep;
            const isDone = isRunning && i < activeStep;
            return (
              <View key={i} style={[styles.stepRow, isActive && styles.activeStepRow]}>
                <View style={[styles.stepNum, isActive && styles.activeStepNum, isDone && styles.doneStepNum]}>
                  {isDone ? (
                    <Icon name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNumText, isActive && styles.activeStepNumText]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepText, isActive && styles.activeStepText]}>{step}</Text>
              </View>
            );
          })}
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
        {!isCompleted && elapsed > 0 && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setIsRunning(false); setSecondsLeft(totalSec); startTimeRef.current = null; }}>
            <Icon name="refresh" size={22} color="#6B7280" />
          </TouchableOpacity>
        )}
        {isCompleted ? (
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#10B981' }]} onPress={() => navigation.goBack()}>
            <Icon name="checkmark-done" size={24} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.playBtnText}>Done</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.playBtn, isRunning && styles.pauseBtn]}
              onPress={() => setIsRunning(!isRunning)}
            >
              <Icon name={isRunning ? 'pause' : 'play'} size={28} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.playBtnText}>{isRunning ? 'Pause' : secondsLeft < totalSec ? 'Resume' : 'Start Exercise'}</Text>
            </TouchableOpacity>
            {elapsed > 30 && !isRunning && (
              <TouchableOpacity style={styles.completeBtn} onPress={handleManualComplete} disabled={isSaving}>
                <Icon name="checkmark-circle" size={22} color="#FFF" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Congratulations Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Icon name="trophy" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Exercise Complete! 🎉</Text>
            <Text style={styles.modalSubtitle}>Great job finishing {exercise.title}</Text>

            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>+{earnedPoints}</Text>
                <Text style={styles.modalStatLabel}>Points</Text>
              </View>
              <View style={[styles.modalStatItem, styles.modalStatBorder]}>
                <Text style={styles.modalStatValue}>{totalPoints}</Text>
                <Text style={styles.modalStatLabel}>Total Pts</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>{streak} 🔥</Text>
                <Text style={styles.modalStatLabel}>Streak</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowModal(false); navigation.goBack(); }}>
              <Text style={styles.modalBtnText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: { width: 90, height: 90, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  heroDuration: { fontSize: 16, opacity: 0.8 },

  timerCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  timerLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' },
  ringCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 42, fontWeight: 'bold', color: '#111827', fontVariant: ['tabular-nums'] },
  timerSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  elapsedText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  completedText: { fontSize: 15, fontWeight: '700', color: '#10B981', marginLeft: 6 },

  stepsCard: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  stepsTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingVertical: 4, paddingHorizontal: 4, borderRadius: 12 },
  activeStepRow: { backgroundColor: '#EFF6FF' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeStepNum: { backgroundColor: '#2563EB' },
  doneStepNum: { backgroundColor: '#10B981' },
  stepNumText: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  activeStepNumText: { color: '#FFF' },
  stepText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },
  activeStepText: { color: '#1E40AF', fontWeight: '600' },

  benefitsCard: { marginHorizontal: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitText: { fontSize: 15, color: '#374151' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: 34, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', gap: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  resetBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  playBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  pauseBtn: { backgroundColor: '#F59E0B' },
  playBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  completeBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center' },
  modalIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  modalSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  modalStatsRow: { flexDirection: 'row', width: '100%', marginBottom: 24 },
  modalStatItem: { flex: 1, alignItems: 'center' },
  modalStatBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' },
  modalStatValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  modalStatLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  modalBtn: { backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});

export default ExerciseDetailScreen;
