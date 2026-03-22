import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../features/auth/LoginScreen';
import RegisterScreen from '../features/auth/RegisterScreen';
import VerifyOtpScreen from '../features/auth/VerifyOtpScreen';
import UserInfoScreen from '../features/auth/UserInfoScreen';
import ChatScreen from '../features/chat/ChatScreen';
import SearchSuggestionScreen from '../features/sessions/SearchSuggestionScreen';
import SearchResultScreen from '../features/sessions/SearchResultScreen';
import TherapistProfileScreen from '../features/sessions/TherapistProfileScreen';
import BookingScreen from '../features/sessions/BookingScreen';
import AppointmentDetailScreen from '../features/sessions/AppointmentDetailScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import ScannerScreen from '../features/scanner/ScannerScreen';
import ScanResultScreen from '../features/scanner/ScanResultScreen';
import ExerciseDetailScreen from '../features/exercises/ExerciseDetailScreen';
import ExerciseHistoryScreen from '../features/exercises/ExerciseHistoryScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import SleepPredictorScreen from '../features/home/SleepPredictorScreen';
import MoodStressPredictorScreen from '../features/home/MoodStressPredictorScreen';
import DepressionPredictorScreen from '../features/home/DepressionPredictorScreen';
import WellnessTrackerScreen from '../features/home/WellnessTrackerScreen';
import CallingScreen from '../features/chat/CallingScreen';
import IncomingCallScreen from '../features/chat/IncomingCallScreen';
import ChatProfileScreen from '../features/chat/ChatProfileScreen';
import AIChatScreen from '../features/chat/AIChatScreen';
import AICallingScreen from '../features/chat/AICallingScreen';
import EmergencyScreen from '../features/emergency/EmergencyScreen';
import SleepTherapyScreen from '../features/sleep/SleepTherapyScreen';
import {
  PersonalInfoScreen,
  PaymentMethodsScreen,
  MedicalRecordsScreen,
  HealthReportsScreen,
  WellnessGoalsScreen,
  PrivacySecurityScreen,
  HelpSupportScreen,
  AboutScreen,
} from '../features/profile/ProfileSubScreens';
import { initiateSocketConnection, getSocket, disconnectSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../store/authSlice';
import { receiveMessage } from '../store/chatSlice';
import apiClient from '../services/apiClient';
import NotificationService from '../services/notificationService';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef(null);

  // Bootstrap: restore token + fetch real profile
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          try {
            const { data } = await apiClient.get('/auth/me');
            dispatch(setCredentials({ token: storedToken, user: data }));

            // Check if profile is incomplete
            if (!data.isProfileComplete) {
              // Automatic re-rendering will handle this based on Redux state
            }
          } catch (profileErr) {
            console.error('Failed to fetch profile:', profileErr);
            if (profileErr.response?.status === 401) {
              await AsyncStorage.removeItem('userToken');
              dispatch(setCredentials({ token: null, user: null }));
            }
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
    if (token && user?._id) {
      initiateSocketConnection(token);
      const socket = getSocket();

      const onConnect = () => socket.emit('register', user._id);
      socket.on('connect', onConnect);
      if (socket.connected) socket.emit('register', user._id);

      socket.on('receive_message', (message) => {
        if (message.receiver === user._id || message.sender === user._id) {
          dispatch(receiveMessage(message));
        }
      });

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

      // --- Setup Notifications ---
      let unsubscribeForeground = null;
      let unsubscribeTokenRefresh = null;

      const setupNotifications = async () => {
        const hasPermission = await NotificationService.requestUserPermission();
        if (hasPermission) {
          await NotificationService.getFCMToken('user');
          unsubscribeForeground = NotificationService.setupForegroundListener();
          unsubscribeTokenRefresh = NotificationService.setupTokenRefreshListener('user');
        }
      };

      setupNotifications();

      return () => {
        socket.off('connect', onConnect);
        disconnectSocket();
        if (unsubscribeForeground) unsubscribeForeground();
        if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      };
    }
  }, [token, user?._id, dispatch]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token && user ? (
          !user.isProfileComplete ? (
            <Stack.Screen name="UserInfo" component={UserInfoScreen} initialParams={{ name: user?.name || '' }} />
          ) : (
            // Main app
            <>
              <Stack.Screen name="Main" component={BottomTabNavigator} />
              <Stack.Screen name="EmergencyScreen" component={EmergencyScreen} />
              <Stack.Screen name="SleepTherapyScreen" component={SleepTherapyScreen} />
              <Stack.Screen name="ChatScreen" component={ChatScreen} />
              <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
              <Stack.Screen name="AICallingScreen" component={AICallingScreen} options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="SearchScreen" component={SearchSuggestionScreen} />
              <Stack.Screen name="SearchResultScreen" component={SearchResultScreen} />
              <Stack.Screen name="TherapistProfileScreen" component={TherapistProfileScreen} />
              <Stack.Screen name="BookingScreen" component={BookingScreen} />
              <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
              <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
              <Stack.Screen name="ScannerScreen" component={ScannerScreen} />
              <Stack.Screen name="ScanResultScreen" component={ScanResultScreen} />
              <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
              <Stack.Screen name="ExerciseHistoryScreen" component={ExerciseHistoryScreen} />
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen name="SleepPredictorScreen" component={SleepPredictorScreen} />
              <Stack.Screen name="MoodStressPredictorScreen" component={MoodStressPredictorScreen} />
              <Stack.Screen name="DepressionPredictorScreen" component={DepressionPredictorScreen} />
              <Stack.Screen name="WellnessTrackerScreen" component={WellnessTrackerScreen} />
              <Stack.Screen name="CallingScreen" component={CallingScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="ChatProfileScreen" component={ChatProfileScreen} options={{ animation: 'none' }} />
              <Stack.Screen name="PersonalInfoScreen" component={PersonalInfoScreen} />
              <Stack.Screen name="PaymentMethodsScreen" component={PaymentMethodsScreen} />
              <Stack.Screen name="MedicalRecordsScreen" component={MedicalRecordsScreen} />
              <Stack.Screen name="HealthReportsScreen" component={HealthReportsScreen} />
              <Stack.Screen name="WellnessGoalsScreen" component={WellnessGoalsScreen} />
              <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} />
              <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
              <Stack.Screen name="AboutScreen" component={AboutScreen} />
            </>
          )
        ) : (
          // Auth flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <Stack.Screen name="UserInfo" component={UserInfoScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
