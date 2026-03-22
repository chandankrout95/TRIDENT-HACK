import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../features/auth/LoginScreen';
import RegisterScreen from '../features/auth/RegisterScreen';
import VerifyOtpScreen from '../features/auth/VerifyOtpScreen';
import PersonalInfoScreen from '../features/auth/PersonalInfoScreen';
import AppointmentDetailsScreen from '../features/appointments/AppointmentDetailsScreen';
import DocumentUploadScreen from '../features/auth/DocumentUploadScreen';
import WaitingApprovalScreen from '../features/auth/WaitingApprovalScreen';
import RejectedScreen from '../features/auth/RejectedScreen';
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
import { PersonalInfoEditScreen } from '../features/profile/ProfileSubScreens';
import NotificationService from '../services/notificationService';

const Stack = createNativeStackNavigator();

// Determine the onboarding route based on therapist profile status
const getTherapistRoute = (therapist) => {
  // If we are calling this, we are usually authenticated. 
  // If therapist data is missing, we must start with PersonalInfo.
  if (!therapist) return 'PersonalInfo';

  const profile = therapist.therapistProfile;

  // No profile yet or missing essential professional info → need to complete personal info
  if (!profile || !profile.qualification || !profile.specialization || !profile.experience) {
    return 'PersonalInfo';
  }
 
  // Profile complete but docs missing → need uploads
  const hasMinDocs = profile.documents && profile.documents.length >= 3;
  if (!hasMinDocs) return 'DocumentUpload';

  // Application status-based routing
  switch (profile.status) {
    case 'pending':
      return 'WaitingApproval';
    case 'rejected':
      return 'Rejected';
    case 'approved':
      return 'Main';
    default:
      return 'PersonalInfo';
  }
};

const AppNavigator = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef(null);

  // Bootstrap: restore token + fetch real profile
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('therapistToken');
        if (storedToken) {
          try {
            const { data } = await apiClient.get('/auth/me');
            dispatch(setCredentials({ token: storedToken, therapist: data }));
          } catch (profileErr) {
            console.error('Failed to fetch profile:', profileErr);
            if (profileErr.response?.status === 401) {
              await AsyncStorage.removeItem('therapistToken');
              dispatch(setCredentials({ token: null, therapist: null }));
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
        dispatch(receiveMessage(message));
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

      socket.on('new_appointment', (appointment) => {
        console.log('New appointment received:', appointment._id);
        import('react-native').then(({ Alert }) => {
          Alert.alert('New Booking!', `Client ${appointment.user?.name || appointment.user?.email || 'someone'} just booked a new session with you.`);
        });
      });

      // --- Setup Notifications ---
      let unsubscribeForeground = null;
      let unsubscribeTokenRefresh = null;
      
      const setupNotifications = async () => {
        const hasPermission = await NotificationService.requestUserPermission();
        if (hasPermission) {
          await NotificationService.getFCMToken('therapist');
          unsubscribeForeground = NotificationService.setupForegroundListener();
          unsubscribeTokenRefresh = NotificationService.setupTokenRefreshListener('therapist');
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const renderAuthenticatedScreens = () => {
    const route = getTherapistRoute(user);

    // If not approved, show onboarding/status screens
    if (route !== 'Main') {
      return (
        <>
          {route === 'PersonalInfo' && <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />}
          {route === 'DocumentUpload' && <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />}
          {route === 'WaitingApproval' && <Stack.Screen name="WaitingApproval" component={WaitingApprovalScreen} />}
          {route === 'Rejected' && (
            <Stack.Screen name="Rejected" component={RejectedScreen}
              initialParams={{ rejectionNote: user?.therapistProfile?.rejectionNote }} />
          )}
          {/* Allow navigating between onboarding screens */}
          <Stack.Screen name="DocumentUploadNav" component={DocumentUploadScreen} />
          <Stack.Screen name="WaitingApprovalNav" component={WaitingApprovalScreen} />
        </>
      );
    }

    // Approved therapist → main app
    return (
      <>
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="CallingScreen" component={CallingScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
        <Stack.Screen name="Withdraw" component={WithdrawScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="PersonalInfoEdit" component={PersonalInfoEditScreen} />
        <Stack.Screen name="AppointmentDetailsScreen" component={AppointmentDetailsScreen} />
      </>
    );
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          renderAuthenticatedScreens()
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
