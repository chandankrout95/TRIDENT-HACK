import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import apiClient from './apiClient';

class NotificationService {
  async requestUserPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
      return enabled;
    } else {
      // Android 13+ requires runtime permission
      try {
        const granted = await messaging().requestPermission();
        return granted === messaging.AuthorizationStatus.AUTHORIZED || granted === messaging.AuthorizationStatus.PROVISIONAL;
      } catch (e) {
        console.log('Permission rejected', e);
        return false;
      }
    }
  }

  async getFCMToken(appType = 'user') {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
      const token = await messaging().getToken();
      if (token) {
        await this.registerTokenWithBackend(token, appType);
      }
      return token;
    } catch (error) {
      console.log('Error getting FCM token:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token, appType) {
    try {
      await apiClient.post('/fcm/register', { token, appType });
      console.log('FCM Token registered with backend');
    } catch (error) {
      console.log('Failed to register FCM token with backend', error);
    }
  }

  async unregisterToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        await apiClient.post('/fcm/unregister', { token });
        console.log('FCM Token unregistered');
      }
    } catch (error) {
      console.log('Failed to unregister FCM token', error);
    }
  }

  setupForegroundListener() {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      
      // Local popup instead of system tray for foreground
      const { notification, data } = remoteMessage;
      if (notification) {
        Alert.alert(notification.title || 'New Notification', notification.body || '');
      }
    });
  }

  setupTokenRefreshListener(appType) {
    return messaging().onTokenRefresh((token) => {
      this.registerTokenWithBackend(token, appType);
    });
  }
}

export default new NotificationService();
