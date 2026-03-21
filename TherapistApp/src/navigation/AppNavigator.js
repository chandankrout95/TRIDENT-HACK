import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../features/auth/LoginScreen';
import ChatScreen from '../features/chat/ChatScreen';
import CallingScreen from '../features/chat/CallingScreen';
import IncomingCallScreen from '../features/chat/IncomingCallScreen';
import NotificationScreen from '../features/notifications/NotificationScreen';
import WithdrawScreen from '../features/transactions/WithdrawScreen';
import TransactionHistoryScreen from '../features/transactions/TransactionHistoryScreen';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../store/authSlice';
import { receiveMessage } from '../store/chatSlice';
import apiClient from '../services/apiClient';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, therapist } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef(null);

  // Bootstrap: restore token + fetch real profile
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('therapistToken');
        if (storedToken) {
          // Set token first so apiClient can use it
          dispatch(setCredentials({ token: storedToken, therapist: null }));

          // Fetch real profile with _id
          try {
            const { data } = await apiClient.get('/auth/me');
            dispatch(setCredentials({ token: storedToken, therapist: data }));
          } catch (profileErr) {
            console.error('Failed to fetch profile, clearing token', profileErr);
            await AsyncStorage.removeItem('therapistToken');
            dispatch(setCredentials({ token: null, therapist: null }));
          }
        }
      } catch (e) {
        console.error('Failed to load token', e);
      }
      setIsReady(true);
    };

    bootstrapAsync();
  }, [dispatch]);

  // Socket setup when authenticated
  useEffect(() => {
    if (token && therapist?._id) {
      initiateSocketConnection(token);
      const socket = getSocket();

      // Register so backend maps _id → socketId (critical for calls + messages)
      socket.emit('register', therapist._id);

      // Real-time messages — dispatch to Redux
      socket.on('receive_message', (message) => {
        dispatch(receiveMessage(message));
      });

      // Incoming call — navigate to IncomingCallScreen
      socket.on('call_incoming', (data) => {
        const nav = navigationRef.current;
        if (nav) {
          nav.navigate('IncomingCallScreen', {
            callerName: data.callerName,
            callerId: data.callerId,
            channelName: data.channelName,
            isVideo: data.isVideo,
          });
        }
      });

      // Real-time new appointment notifications
      socket.on('new_appointment', (appointment) => {
        // This is handled by individual screens (HomeScreen, AppointmentScreen)
        // The global listener ensures socket stays connected
        console.log('New appointment received:', appointment._id);
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [token, therapist?._id, dispatch]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="CallingScreen" component={CallingScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
