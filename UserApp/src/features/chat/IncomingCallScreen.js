import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  BackHandler, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withDelay,
  withTiming, Easing, interpolate, Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getSocket } from '../../services/socket';

const { width: SCREEN_W } = Dimensions.get('window');

const IncomingCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { callerName, callerId, channelName, isVideo } = route.params || {};
  const answeredRef = useRef(false);

  // Block back
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  // Ripple animations
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 2200, easing: Easing.out(Easing.ease) };
    ring1.value = withRepeat(withTiming(1, cfg), -1, false);
    ring2.value = withDelay(500, withRepeat(withTiming(1, cfg), -1, false));
    ring3.value = withDelay(1000, withRepeat(withTiming(1, cfg), -1, false));
  }, []);

  const makeRingStyle = (sv) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(sv.value, [0, 1], [1, 2.6], Extrapolate.CLAMP) }],
      opacity: interpolate(sv.value, [0, 0.15, 1], [0, 0.5, 0], Extrapolate.CLAMP),
    }));

  const ringStyle1 = makeRingStyle(ring1);
  const ringStyle2 = makeRingStyle(ring2);
  const ringStyle3 = makeRingStyle(ring3);

  // Pulse for accept button
  const acceptPulse = useSharedValue(1);
  useEffect(() => {
    acceptPulse.value = withRepeat(
      withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const acceptPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: acceptPulse.value }],
  }));

  // Listen for call_ended (caller cancelled)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onEnded = () => {
      if (!answeredRef.current) {
        navigation.goBack();
      }
    };

    socket.on('call_ended', onEnded);
    return () => socket.off('call_ended', onEnded);
  }, []);

  const handleAccept = () => {
    answeredRef.current = true;
    const socket = getSocket();
    if (socket) {
      socket.emit('call_accepted', { callerId, channelName });
    }
    // Navigate to CallingScreen with skipRinging
    navigation.replace('CallingScreen', {
      personaName: callerName || 'Therapist',
      themeColor: '#2563EB',
      channelName,
      isVideo,
      skipRinging: true,
      callerId,
    });
  };

  const handleReject = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('call_rejected', { callerId });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.content}>
        {/* Ripples */}
        <Animated.View style={[styles.ringCircle, ringStyle1]} />
        <Animated.View style={[styles.ringCircle, ringStyle2]} />
        <Animated.View style={[styles.ringCircle, ringStyle3]} />

        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Icon name="person" size={52} color="#FFF" />
        </View>

        <Text style={styles.callerName}>{callerName || 'Unknown'}</Text>
        <Text style={styles.callType}>
          Incoming {isVideo ? 'Video' : 'Voice'} Call
        </Text>
      </View>

      {/* Accept / Reject */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
          <Icon name="call" size={30} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.actionLabel}>Decline</Text>
        </TouchableOpacity>

        <Animated.View style={acceptPulseStyle}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
            <Icon name={isVideo ? 'videocam' : 'call'} size={30} color="#FFF" />
            <Text style={styles.actionLabel}>Accept</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  ringCircle: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, borderColor: '#22C55E',
  },

  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
    elevation: 12, shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 20,
    marginBottom: 28,
  },

  callerName: {
    color: '#F1F5F9', fontSize: 30, fontWeight: 'bold',
  },
  callType: {
    color: '#94A3B8', fontSize: 16, fontWeight: '500', marginTop: 8,
  },

  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingBottom: 60, paddingHorizontal: 50,
  },

  rejectBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    elevation: 10, shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 16,
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
    elevation: 10, shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 16,
  },
  actionLabel: {
    color: '#FFF', fontSize: 11, fontWeight: '700', marginTop: 2,
  },
});

export default IncomingCallScreen;
