import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  BackHandler, PermissionsAndroid, Platform, Alert, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withDelay,
  withTiming, withSequence, Easing, interpolate, Extrapolate, runOnJS,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import createAgoraRtcEngine, {
  ChannelProfileType, ClientRoleType, RtcSurfaceView, VideoSourceType,
} from 'react-native-agora';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socket';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
const CallingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    personaName, themeColor = '#2563EB', channelName,
    isVideo = false, receiverId,
    // When coming from IncomingCallScreen (answering a call)
    skipRinging = false, callerId: incomingCallerId,
  } = route.params || {};

  const { user } = useSelector(s => s.auth);
  const engineRef = useRef(null);
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);

  // ── Call state ────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState(
    skipRinging ? 'connecting' : 'ringing'
  ); // ringing | connecting | connected | ended | declined | busy
  const [seconds, setSeconds] = useState(0);
  const [remoteUid, setRemoteUid] = useState(null);

  const secondsRef = useRef(0);
  const logSavedRef = useRef(false);

  // ── Controls ──────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ── Animations ────────────────────────────────────────────────────────────
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const fadeAnim = useSharedValue(1);
  const endOpacity = useSharedValue(0);

  // ── Block hardware back ───────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  // ── Timer (only when connected) ───────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setSeconds(s => {
          secondsRef.current = s + 1;
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const saveCallLog = useCallback((statusOverride) => {
    if (skipRinging || logSavedRef.current) return;
    logSavedRef.current = true;
    
    const socket = socketRef.current;
    if (!socket || !receiverId) return;

    socket.emit('save_call_log', {
      senderId: user?._id,
      receiverId,
      isVideo,
      duration: secondsRef.current,
      status: statusOverride || 'completed',
    });
  }, [skipRinging, receiverId, isVideo, user?._id]);

  // ── Ringing animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'ringing' || callState === 'connecting') {
      const cfg = { duration: 2000, easing: Easing.out(Easing.ease) };
      ring1.value = withRepeat(withTiming(1, cfg), -1, false);
      ring2.value = withDelay(400, withRepeat(withTiming(1, cfg), -1, false));
      ring3.value = withDelay(800, withRepeat(withTiming(1, cfg), -1, false));
    }
  }, [callState]);

  const makeRingStyle = (sv) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(sv.value, [0, 1], [1, 2.4], Extrapolate.CLAMP) }],
      opacity: interpolate(sv.value, [0, 0.2, 1], [0, 0.6, 0], Extrapolate.CLAMP),
    }));

  const ringStyle1 = makeRingStyle(ring1);
  const ringStyle2 = makeRingStyle(ring2);
  const ringStyle3 = makeRingStyle(ring3);

  // ── Permissions ───────────────────────────────────────────────────────────
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const perms = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (isVideo) perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      const granted = await PermissionsAndroid.requestMultiple(perms);
      const audioOk = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      const cameraOk = isVideo
        ? granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
        : true;
      return audioOk && cameraOk;
    }
    return true;
  };

  // ── Join Agora channel ────────────────────────────────────────────────────
  const joinAgoraChannel = async () => {
    const permsOk = await requestPermissions();
    if (!permsOk) {
      Alert.alert('Permissions Required', 'Microphone permission is needed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    try {
      const channel = channelName || `session_${Date.now()}`;
      const response = await apiClient.post('/agora/token', {
        channelName,
        uid: 0, // Auto-assign numeric UID (Agora requires integers, not MongoDB strings)
        role: 'publisher',
      });
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({ appId: response.data.appId });
      engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableAudio();
      engine.setEnableSpeakerphone(true);

      if (isVideo) {
        engine.enableVideo();
        engine.startPreview();
      }

      engine.addListener('onJoinChannelSuccess', () => {
        setCallState('connected');
      });

      engine.addListener('onUserJoined', (_conn, uid) => {
        setRemoteUid(uid);
      });

      engine.addListener('onUserOffline', () => {
        setRemoteUid(null);
        handleEndCall();
      });

      engine.addListener('onError', (err) => {
        console.error('Agora error:', err);
      });

      engine.joinChannel(response.data.token, channel, response.data.uid, {});
    } catch (err) {
      console.error('Agora init error:', err);
      Alert.alert('Connection Error', 'Unable to connect. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  // ── Socket signaling ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    if (skipRinging) {
      // We answered an incoming call — go straight to Agora
      setCallState('connecting');
      joinAgoraChannel();
    } else {
      // We are the caller — send call_initiate and wait
      socket.emit('call_initiate', {
        callerId: user?._id,
        callerName: user?.name || user?.email || 'User',
        receiverId,
        channelName,
        isVideo,
      });

      // 45s timeout
      timeoutRef.current = setTimeout(() => {
        if (callState === 'ringing') {
          saveCallLog('missed');
          socket.emit('call_ended', { otherUserId: receiverId });
          setCallState('ended');
          setTimeout(() => navigation.goBack(), 2000);
        }
      }, 45000);
    }

    // Listen for responses
    const onAccepted = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCallState('connecting');
      joinAgoraChannel();
    };

    const onRejected = () => {
      saveCallLog('declined');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCallState('declined');
      setTimeout(() => navigation.goBack(), 2000);
    };

    const onBusy = () => {
      saveCallLog('busy');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCallState('busy');
      setTimeout(() => navigation.goBack(), 2000);
    };

    const onEnded = () => {
      saveCallLog('completed');
      handleEndCall();
    };

    socket.on('call_accepted', onAccepted);
    socket.on('call_rejected', onRejected);
    socket.on('call_busy', onBusy);
    socket.on('call_ended', onEnded);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.off('call_accepted', onAccepted);
      socket.off('call_rejected', onRejected);
      socket.off('call_busy', onBusy);
      socket.off('call_ended', onEnded);
    };
  }, []);

  // ── Cleanup Agora on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch (e) { /* */ }
        engineRef.current = null;
      }
    };
  }, []);

  // ── End-state animations ──────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'ended' || callState === 'declined' || callState === 'busy') {
      fadeAnim.value = withTiming(0, { duration: 400 });
      endOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    }
  }, [callState]);

  const endedContentStyle = useAnimatedStyle(() => ({
    opacity: endOpacity.value,
    transform: [{ translateY: interpolate(endOpacity.value, [0, 1], [30, 0]) }],
  }));

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (engineRef.current) {
      engineRef.current.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (engineRef.current) {
      engineRef.current.setEnableSpeakerphone(!isSpeaker);
      setIsSpeaker(!isSpeaker);
    }
  };

  const toggleCamera = () => {
    if (engineRef.current && isVideo) {
      engineRef.current.enableLocalVideo(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  const switchCamera = () => {
    if (engineRef.current && isVideo) {
      engineRef.current.switchCamera();
    }
  };

  const handleEndCall = useCallback(() => {
    setCallState(prev => {
      if (prev === 'ended' || prev === 'declined' || prev === 'busy') return prev;
      saveCallLog('completed');
      // Notify other party
      const socket = socketRef.current;
      const otherUserId = skipRinging ? incomingCallerId : receiverId;
      if (socket && otherUserId) {
        socket.emit('call_ended', { otherUserId });
      }
      // Leave Agora
      if (engineRef.current) {
        try { engineRef.current.leaveChannel(); } catch (e) { /* */ }
      }
      setTimeout(() => navigation.goBack(), 2000);
      return 'ended';
    });
  }, [saveCallLog, skipRinging, incomingCallerId, receiverId, navigation]);

  const cancelCall = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    saveCallLog('missed');
    const socket = socketRef.current;
    if (socket && receiverId) {
      socket.emit('call_ended', { otherUserId: receiverId });
    }
    navigation.goBack();
  }, [saveCallLog, receiverId, navigation]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── Status label ──────────────────────────────────────────────────────────
  const getStatusLabel = () => {
    switch (callState) {
      case 'ringing': return 'Ringing…';
      case 'connecting': return 'Connecting…';
      case 'connected': return isVideo ? 'Video Call' : 'Voice Call';
      case 'ended': return 'Call Ended';
      case 'declined': return 'Call Declined';
      case 'busy': return 'User Unavailable';
      default: return '';
    }
  };

  const isTerminal = callState === 'ended' || callState === 'declined' || callState === 'busy';
  const isActive = callState === 'connected';
  const showVideo = isVideo && isActive && !isTerminal;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Video layer ──────────────────────────────────────────────────── */}
      {showVideo && (
        <>
          {remoteUid !== null ? (
            <RtcSurfaceView style={styles.remoteVideo} canvas={{ uid: remoteUid }} />
          ) : (
            <View style={styles.remoteVideoPlaceholder}>
              <Icon name="person" size={64} color="#475569" />
              <Text style={styles.waitingText}>Waiting for video…</Text>
            </View>
          )}

          {!isCameraOff && (
            <View style={styles.localVideoContainer}>
              <RtcSurfaceView
                style={styles.localVideo}
                canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              />
            </View>
          )}
        </>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <View style={[styles.content, showVideo && styles.videoOverlay]}>

        {/* Top bar — name + duration (video connected) */}
        {showVideo && (
          <View style={styles.topBar}>
            <View style={styles.topBarPill}>
              <View style={styles.liveIndicator} />
              <Text style={styles.topBarDuration}>{formatTime(seconds)}</Text>
            </View>
            <Text style={styles.topBarName}>{personaName || 'Therapist'}</Text>
          </View>
        )}

        {/* Center — avatar + status (ringing / audio connected / terminal) */}
        {!showVideo && (
          <View style={styles.centerArea}>
            {/* Ringing ripples */}
            {(callState === 'ringing' || callState === 'connecting') && (
              <>
                <Animated.View style={[styles.ringCircle, { borderColor: themeColor }, ringStyle1]} />
                <Animated.View style={[styles.ringCircle, { borderColor: themeColor }, ringStyle2]} />
                <Animated.View style={[styles.ringCircle, { borderColor: themeColor }, ringStyle3]} />
              </>
            )}

            {/* Terminal state icon */}
            {isTerminal && (
              <Animated.View style={[styles.centerContent, endedContentStyle]}>
                <View style={[styles.endedIconCircle, callState === 'declined' && { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)' }]}>
                  <Icon
                    name={callState === 'declined' ? 'close-circle' : callState === 'busy' ? 'alert-circle' : 'call'}
                    size={44}
                    color={callState === 'declined' ? '#F59E0B' : '#EF4444'}
                    style={callState === 'ended' ? { transform: [{ rotate: '135deg' }] } : {}}
                  />
                </View>
                <Text style={styles.terminalName}>{personaName || 'Therapist'}</Text>
                <Text style={[styles.terminalStatus, callState === 'declined' && { color: '#F59E0B' }]}>
                  {getStatusLabel()}
                </Text>
                {callState === 'ended' && seconds > 0 && (
                  <Text style={styles.terminalDuration}>{formatTime(seconds)}</Text>
                )}
              </Animated.View>
            )}

            {/* Ringing / connecting / audio-connected avatar */}
            {!isTerminal && (
              <View style={styles.centerContent}>
                <View style={[styles.avatarCircle, { backgroundColor: themeColor }]}>
                  <Icon name="person" size={48} color="#FFF" />
                </View>
                <Text style={styles.personaName}>{personaName || 'Therapist'}</Text>
                <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
                {isActive && (
                  <Text style={styles.duration}>{formatTime(seconds)}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Bottom controls ──────────────────────────────────────────── */}
        {!isTerminal && (
          <View style={[styles.bottomBar, showVideo && styles.bottomBarVideo]}>
            {/* Active call controls */}
            {(isActive || callState === 'connecting') && (
              <View style={styles.controlsGrid}>
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={toggleMute}
                >
                  <Icon name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#EF4444' : '#FFF'} />
                  <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                {isVideo && (
                  <TouchableOpacity
                    style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
                    onPress={toggleCamera}
                  >
                    <Icon name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color={isCameraOff ? '#EF4444' : '#FFF'} />
                    <Text style={styles.controlLabel}>{isCameraOff ? 'Cam On' : 'Cam Off'}</Text>
                  </TouchableOpacity>
                )}

                {isVideo && (
                  <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
                    <Icon name="camera-reverse" size={24} color="#FFF" />
                    <Text style={styles.controlLabel}>Flip</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
                  onPress={toggleSpeaker}
                >
                  <Icon name={isSpeaker ? 'volume-high' : 'volume-low'} size={24} color="#FFF" />
                  <Text style={styles.controlLabel}>Speaker</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* End / Cancel button */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={isActive || callState === 'connecting' ? handleEndCall : cancelCall}
              activeOpacity={0.8}
            >
              <Icon name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { flex: 1, justifyContent: 'space-between' },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },

  /* ── Video ── */
  remoteVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  remoteVideoPlaceholder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
    backgroundColor: '#111318', alignItems: 'center', justifyContent: 'center',
  },
  waitingText: { color: '#64748B', fontSize: 14, marginTop: 12 },
  localVideoContainer: {
    position: 'absolute', top: 60, right: 16, width: 110, height: 150,
    borderRadius: 16, overflow: 'hidden', zIndex: 20,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
  },
  localVideo: { flex: 1 },

  /* ── Top bar (video) ── */
  topBar: { alignItems: 'center', paddingTop: 60, zIndex: 15 },
  topBarPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 8 },
  topBarDuration: { color: '#FFF', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  topBarName: {
    color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },

  /* ── Center area ── */
  centerArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  centerContent: { alignItems: 'center', zIndex: 5 },
  ringCircle: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, opacity: 0,
  },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12,
  },
  personaName: { color: '#F1F5F9', fontSize: 28, fontWeight: 'bold', marginTop: 24 },
  statusLabel: { color: '#94A3B8', fontSize: 15, fontWeight: '500', marginTop: 6, letterSpacing: 0.3 },
  duration: { color: '#64748B', fontSize: 16, marginTop: 8, fontVariant: ['tabular-nums'] },

  /* ── Terminal states ── */
  endedIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  terminalName: { color: '#F1F5F9', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  terminalStatus: { color: '#EF4444', fontSize: 14, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  terminalDuration: { color: '#475569', fontSize: 14, marginTop: 8 },

  /* ── Bottom bar ── */
  bottomBar: {
    alignItems: 'center', paddingBottom: 50, paddingTop: 16,
  },
  bottomBarVideo: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingBottom: 44, paddingTop: 20,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  controlsGrid: {
    flexDirection: 'row', justifyContent: 'center',
    flexWrap: 'wrap', gap: 16, marginBottom: 24, paddingHorizontal: 30,
  },
  controlBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  controlLabel: { color: '#94A3B8', fontSize: 10, marginTop: 4, fontWeight: '600' },

  endCallBtn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    elevation: 12, shadowColor: '#EF4444', shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});

export default CallingScreen;
