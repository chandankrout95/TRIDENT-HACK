import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, DeviceEventEmitter, NativeModules } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../features/home/HomeScreen';
import ConversationListScreen from '../features/chat/ConversationListScreen';
import PersonaSelectionScreen from '../features/chat/PersonaSelectionScreen';
import SessionsScreen from '../features/sessions/SessionsScreen';
import ExercisesScreen from '../features/exercises/ExercisesScreen';

const { BinauralBeatPlayer } = NativeModules;
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const navigation = useNavigation();
  const [sleepSession, setSleepSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Listen for sleep session events
  useEffect(() => {
    const startSub = DeviceEventEmitter.addListener('sleepSessionStarted', (data) => {
      setSleepSession(data);
      setElapsed(0);
      setIsPaused(false);
    });
    const stopSub = DeviceEventEmitter.addListener('sleepSessionStopped', () => {
      setSleepSession(null);
      setElapsed(0);
      setIsPaused(false);
      clearInterval(timerRef.current);
    });
    const tickSub = DeviceEventEmitter.addListener('sleepSessionTick', (data) => {
      setTimeout(() => setElapsed(data.elapsed), 0);
    });

    return () => { startSub.remove(); stopSub.remove(); tickSub.remove(); };
  }, []);

  const stopSleepSession = async () => {
    try { await BinauralBeatPlayer?.stop(); } catch {}
    setSleepSession(null);
    setElapsed(0);
    setIsPaused(false);
    clearInterval(timerRef.current);
    DeviceEventEmitter.emit('sleepSessionStopped');
  };

  const pauseSleepSession = () => {
    setIsPaused(p => !p);
    DeviceEventEmitter.emit('sleepSessionPaused');
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Sessions') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'AI Bot') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Exercises') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Messages" component={ConversationListScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="AI Bot" component={PersonaSelectionScreen} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} />
      </Tab.Navigator>

      {/* Floating Sleep Mini-Player — shown when session is active */}
      {sleepSession && (
        <View style={styles.miniPlayer}>
          <TouchableOpacity
            style={styles.miniPlayerContent}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SleepTherapyScreen')}
          >
            <View style={styles.miniPlayerPulse}>
              <Icon name="moon" size={18} color="#818CF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.miniPlayerTitle}>🌙 Sleep Therapy</Text>
              <Text style={styles.miniPlayerSub}>{sleepSession.goal || 'Playing'} • {fmtTime(elapsed)}{isPaused ? ' • Paused' : ''}</Text>
            </View>
            <TouchableOpacity style={styles.miniPlayerPause} onPress={pauseSleepSession}>
              <Icon name={isPaused ? 'play' : 'pause'} size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniPlayerStop} onPress={stopSleepSession}>
              <Icon name="stop" size={16} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Sleep Therapy FAB — above emergency (hidden when mini-player visible) */}
      {!sleepSession && (
        <TouchableOpacity 
          style={styles.sleepFab} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SleepTherapyScreen')}
        >
          <Icon name="moon" size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Global Emergency FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EmergencyScreen')}
      >
        <Icon name="warning" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 160 : 150,
    right: 20,
    backgroundColor: '#DC2626',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sleepFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 85,
    right: 20,
    backgroundColor: '#6366F1',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  miniPlayer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 72 : 68,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  miniPlayerPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayerTitle: {
    color: '#E9EDEF',
    fontSize: 14,
    fontWeight: '700',
  },
  miniPlayerSub: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  miniPlayerStop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  miniPlayerPause: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
