import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated,
  NativeModules, NativeEventEmitter, PermissionsAndroid, Platform, Alert, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import Tts from 'react-native-tts';

const { SpeechRecognizer } = NativeModules;
const speechEvents = SpeechRecognizer ? new NativeEventEmitter(SpeechRecognizer) : null;

const PERSONA_EMOJI = {
  Girlfriend: '💕', Bestfriend: '🤝', Mother: '🌹',
  Father: '🛡️', Brother: '🎮', Sister: '🌸',
  'Personal AI Therapist': '🩺',
};

const LANGUAGES = [
  { code: 'en-IN', label: 'EN', ttsLang: 'en-IN' },
  { code: 'hi-IN', label: 'हि', ttsLang: 'hi-IN' },
];

const AICallingScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user } = useSelector(s => s.auth);

  const persona = route?.params?.persona || 'Personal AI Therapist';
  const themeColor = route?.params?.personaColor || '#2563EB';
  const personaIcon = route?.params?.personaIcon || 'chatbubble-ellipses';
  const emoji = PERSONA_EMOJI[persona] || '🤖';

  // States
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, listening, thinking, speaking, idle
  const [callDuration, setCallDuration] = useState(0);
  const [partialText, setPartialText] = useState('');
  const [lastUserText, setLastUserText] = useState('');
  const [lastAiText, setLastAiText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [langIndex, setLangIndex] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const callActive = useRef(true);
  const callTimer = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const currentLang = LANGUAGES[langIndex];

  // ─── Call Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    callTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(callTimer.current);
  }, []);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── Pulse animation ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // ─── Wave animation for speaking ────────────────────────────────────────
  useEffect(() => {
    if (callStatus === 'speaking' || callStatus === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [callStatus, waveAnim]);

  // ─── TTS Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      Tts.setDefaultRate(0.48);
      Tts.setDefaultPitch(1.05);
    } catch {}

    let finishSub, cancelSub;
    try {
      finishSub = Tts.addEventListener('tts-finish', () => {
        setCallStatus('idle');
        // After AI finishes speaking, start listening again
        if (callActive.current && !isMuted) {
          setTimeout(() => startListening(), 400);
        }
      });
      cancelSub = Tts.addEventListener('tts-cancel', () => {
        setCallStatus('idle');
      });
    } catch {}

    return () => {
      try { finishSub?.remove(); cancelSub?.remove(); } catch {}
    };
  }, [isMuted]);

  // ─── Speech Recognition Events ──────────────────────────────────────────
  useEffect(() => {
    if (!speechEvents) return;

    const subs = [
      speechEvents.addListener('onSpeechReady', () => {
        setCallStatus('listening');
        setPartialText('');
      }),
      speechEvents.addListener('onSpeechStart', () => {
        setCallStatus('listening');
      }),
      speechEvents.addListener('onSpeechPartial', (e) => {
        if (e.text) setPartialText(e.text);
      }),
      speechEvents.addListener('onSpeechResult', (e) => {
        if (e.text && e.text.trim() && callActive.current) {
          const text = e.text.trim();
          setLastUserText(text);
          setPartialText('');
          setCallStatus('thinking');
          sendToAI(text);
        }
      }),
      speechEvents.addListener('onSpeechEnd', () => {
        // No-op, wait for result
      }),
      speechEvents.addListener('onSpeechError', (e) => {
        // On timeout or no match, restart listening
        if (callActive.current && !isMuted) {
          if (e.error === 'TIMEOUT' || e.error === 'NO_MATCH') {
            setTimeout(() => startListening(), 300);
          } else {
            setCallStatus('idle');
            setTimeout(() => startListening(), 1000);
          }
        }
      }),
      speechEvents.addListener('onSpeechVolume', (e) => {
        setVolumeLevel(Math.max(0, Math.min(1, (e.value + 2) / 12)));
      }),
    ];

    return () => subs.forEach(s => s.remove());
  }, [isMuted]);

  // ─── Socket Listener for AI Response ────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAiResponse = (msg) => {
      if (msg.persona === persona && callActive.current) {
        setLastAiText(msg.content);
        setCallStatus('speaking');
        speakText(msg.content);
      }
    };

    const onAiTyping = ({ persona: p, isTyping }) => {
      if (p === persona && isTyping) setCallStatus('thinking');
    };

    socket.on('ai_response', onAiResponse);
    socket.on('ai_typing', onAiTyping);

    return () => {
      socket.off('ai_response', onAiResponse);
      socket.off('ai_typing', onAiTyping);
    };
  }, [persona]);

  // ─── Start the call ─────────────────────────────────────────────────────
  useEffect(() => {
    const initCall = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone', message: 'Voice call needs microphone access.', buttonPositive: 'Allow' }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone access is needed for voice calls.');
          navigation.goBack();
          return;
        }
      }
      setTimeout(() => startListening(), 800);
    };
    initCall();

    return () => {
      callActive.current = false;
      try { Tts.stop(); } catch {}
      try { SpeechRecognizer?.destroy(Promise.resolve); } catch {}
    };
  }, []);

  // ─── Helper Functions ───────────────────────────────────────────────────
  const startListening = async () => {
    if (!SpeechRecognizer || !callActive.current || isMuted) return;
    try {
      await SpeechRecognizer.startListening(currentLang.code);
    } catch (err) {
      console.warn('startListening error:', err);
      // Retry after delay
      if (callActive.current) setTimeout(() => startListening(), 1500);
    }
  };

  const speakText = (text) => {
    try {
      Tts.stop();
      Tts.setDefaultLanguage(currentLang.ttsLang).catch(() => {});
      Tts.speak(text);
    } catch (e) {
      console.warn('TTS error:', e);
      // If TTS fails, restart listening
      if (callActive.current) setTimeout(() => startListening(), 500);
    }
  };

  const sendToAI = (text) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('send_ai_message', {
        userId: user._id,
        persona,
        content: text,
      });
    }
  };

  const endCall = () => {
    callActive.current = false;
    try { Tts.stop(); } catch {}
    try { SpeechRecognizer?.stopListening(Promise.resolve); } catch {}
    try { SpeechRecognizer?.destroy(Promise.resolve); } catch {}
    navigation.goBack();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      try { SpeechRecognizer?.stopListening(Promise.resolve); } catch {}
      setCallStatus('idle');
    } else {
      setTimeout(() => startListening(), 300);
    }
  };

  const toggleLanguage = () => {
    setLangIndex((langIndex + 1) % LANGUAGES.length);
  };

  // ─── Status Text ────────────────────────────────────────────────────────
  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening...';
      case 'thinking': return `${persona} is thinking...`;
      case 'speaking': return `${persona} is speaking...`;
      case 'idle': return isMuted ? 'Muted' : 'Connected';
      default: return 'Connected';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'listening': return '#25D366';
      case 'thinking': return '#FFA500';
      case 'speaking': return themeColor;
      default: return '#8696A0';
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background gradient effect */}
      <View style={[styles.bgGlow, { backgroundColor: themeColor + '15' }]} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Center — Avatar & Status */}
      <View style={styles.center}>
        <Animated.View style={[styles.avatarRing, { borderColor: getStatusColor(), transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.avatarCircle, { backgroundColor: themeColor + '25' }]}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
        </Animated.View>

        <Text style={styles.personaName}>{persona}</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>

        {/* Voice visualization */}
        {(callStatus === 'listening' || callStatus === 'speaking') && (
          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, i) => {
              const delay = i * 100;
              const height = callStatus === 'listening'
                ? 8 + volumeLevel * 30
                : 8 + Math.sin(Date.now() / 200 + i) * 15;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: getStatusColor(),
                      height: Math.max(6, height),
                      opacity: 0.4 + (volumeLevel || 0.5) * 0.6,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* Transcript bubbles */}
        <View style={styles.transcriptArea}>
          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {partialText ? (
              <View style={styles.transcriptBubble}>
                <Icon name="mic" size={14} color="#25D366" />
                <Text style={[styles.transcriptText, { color: '#25D366' }]}>
                  {partialText}
                </Text>
              </View>
            ) : lastUserText && callStatus === 'thinking' ? (
              <View style={styles.transcriptBubble}>
                <Icon name="person" size={14} color="#8696A0" />
                <Text style={styles.transcriptText}>You: {lastUserText}</Text>
              </View>
            ) : lastAiText && callStatus === 'speaking' ? (
              <View style={styles.transcriptBubble}>
                <Icon name={personaIcon} size={14} color={themeColor} />
                <Text style={[styles.transcriptText, { color: themeColor }]}>
                  {lastAiText}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Mute */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && { backgroundColor: '#EF4444' }]}
          onPress={toggleMute}
        >
          <Icon name={isMuted ? 'mic-off' : 'mic'} size={28} color="#FFF" />
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
          <Icon name="call" size={32} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        {/* Speaker */}
        <TouchableOpacity
          style={[styles.controlBtn, isSpeakerOn && { backgroundColor: themeColor + '40' }]}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          <Icon name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={28} color="#FFF" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0E14' },
  bgGlow: {
    position: 'absolute', top: -100, left: -100, right: -100, bottom: '50%',
    borderRadius: 999, opacity: 0.5,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 24,
  },
  langChip: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  langChipText: { fontSize: 13, fontWeight: 'bold' },
  timerText: { fontSize: 16, color: '#8696A0', fontWeight: '600', fontVariant: ['tabular-nums'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  avatarRing: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 52 },
  personaName: { fontSize: 26, fontWeight: 'bold', color: '#E9EDEF', marginTop: 20 },
  statusText: { fontSize: 15, marginTop: 6, fontWeight: '500' },
  waveContainer: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: 24, height: 40,
    gap: 6,
  },
  waveBar: { width: 5, borderRadius: 3, minHeight: 6 },
  transcriptArea: { marginTop: 20, paddingHorizontal: 32, minHeight: 60, width: '100%' },
  transcriptBubble: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A2530', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10,
  },
  transcriptText: { color: '#8696A0', fontSize: 14, marginLeft: 8, flex: 1, textAlign: 'center' },
  controls: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingBottom: 50, paddingHorizontal: 30,
  },
  controlBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1E2A35', alignItems: 'center', justifyContent: 'center',
  },
  controlLabel: { color: '#8696A0', fontSize: 10, marginTop: 2 },
  endCallBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});

export default AICallingScreen;
