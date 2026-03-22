import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { useSelector } from 'react-redux';
import { getSocket } from '../services/socket';
import apiClient from '../services/apiClient';

const WATCH_PACKAGES = [
  'com.hband.boat',
  'com.crrepa.band.dafit',
  'com.fitbit.FitbitMobile',
  'com.samsung.android.app.shealth',
  'com.xiaomi.hm.health',
  'com.google.android.apps.fitness', // Google Fit
  'com.google.android.apps.healthdata' // Health Connect
];

const useWatchSync = () => {
  const { user } = useSelector((state) => state.auth);
  const [vitals, setVitals] = useState({
    steps: 0,
    heartRate: 0,
    calories: 0,
    sleep: '0h 0m',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [sdkStatus, setSdkStatus] = useState(null);

  const checkAvailability = useCallback(async () => {
    if (Platform.OS !== 'android') return false;
    try {
      const status = await getSdkStatus();
      setSdkStatus(status);
      return status === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch (error) {
      console.error('Health Connect availability check failed:', error);
      return false;
    }
  }, []);

  const syncNow = useCallback(async (isAuto = false) => {
    if (Platform.OS !== 'android') return;
    
    const isAvailable = await checkAvailability();
    if (!isAvailable) {
      if (!isAuto && sdkStatus === SdkAvailabilityStatus.SDK_NOT_INSTALLED) {
        Alert.alert('Setup Health Connect', 'Health Connect is not installed. Please install it from the Play Store to sync your watch data.');
      }
      return;
    }

    if (!isAuto) setIsSyncing(true);
    try {
      await initialize();
      
      // Request permissions
      const permissions = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'SleepSession' },
      ];
      
      const granted = await requestPermission(permissions);
      if (!granted) {
        Alert.alert('Permissions Required', 'Please grant health permissions to sync your data.');
        return;
      }

      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endTime = now.toISOString();

      // Fetch Records
      const stepsRecords = await readRecords('Steps', { timeRangeFilter: { operator: 'between', startTime, endTime } });
      const hrRecords = await readRecords('HeartRate', { timeRangeFilter: { operator: 'between', startTime, endTime } });
      const calsRecords = await readRecords('TotalCaloriesBurned', { timeRangeFilter: { operator: 'between', startTime, endTime } });
      const sleepRecords = await readRecords('SleepSession', { timeRangeFilter: { operator: 'between', startTime, endTime } });

      // Smart Filtering: Prioritize Watch Apps
      const filterByWatch = (records) => {
        const watchData = records.filter(r => WATCH_PACKAGES.includes(r.metadata?.dataOrigin));
        return watchData.length > 0 ? watchData : records;
      };

      const filteredSteps = filterByWatch(stepsRecords.records);
      const filteredHR = filterByWatch(hrRecords.records);
      const filteredCals = filterByWatch(calsRecords.records);
      
      // Aggregate Data
      const totalSteps = filteredSteps.reduce((acc, curr) => acc + curr.count, 0);
      const latestHR = filteredHR.length > 0 ? filteredHR[filteredHR.length - 1].samples[filteredHR[filteredHR.length - 1].samples.length - 1]?.beatsPerMinute : 0;
      const totalCals = filteredCals.reduce((acc, curr) => acc + curr.energy.inCalories, 0);
      
      // Sleep Calculation
      let totalSleepMinutes = 0;
      sleepRecords.records.forEach(session => {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        totalSleepMinutes += (end - start) / (1000 * 60);
      });
      const sleepStr = `${Math.floor(totalSleepMinutes / 60)}h ${Math.floor(totalSleepMinutes % 60)}m`;

      const newVitals = {
        steps: totalSteps,
        heartRate: latestHR || 0,
        calories: Math.round(totalCals),
        sleep: sleepStr,
      };

      setVitals(newVitals);
      setLastSynced(new Date());

      // Store snapshot in DB (keeps last 7)
      try {
        await apiClient.post('/health/sync', { vitals: newVitals });
      } catch (snapErr) {
        console.warn('Health snapshot save failed:', snapErr);
      }

      // Socket Relay
      const socket = getSocket();
      if (socket && user?._id) {
        socket.emit('patient_vitals_update', {
          userId: user._id,
          vitals: newVitals,
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Error', 'Failed to fetch data from Health Connect.');
    } finally {
      if (!isAuto) setIsSyncing(false);
    }
  }, [checkAvailability, user?._id]);

  const clearData = useCallback(async () => {
    try {
      setVitals({ steps: 0, heartRate: 0, calories: 0, sleep: '0h 0m' });
      setLastSynced(null);
      await apiClient.delete('/health/clear');
      if (Platform.OS === 'android') {
        Alert.alert('Success', 'Health data cache cleared.');
      }
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }, []);

  useEffect(() => {
    checkAvailability();
    
    // Auto-poll every 10 seconds for real-time feel
    let interval;
    if (Platform.OS === 'android') {
      interval = setInterval(() => {
        syncNow(true);
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkAvailability, syncNow]);

  return {
    vitals,
    isSyncing,
    lastSynced,
    syncNow,
    clearData,
    sdkStatus,
  };
};

export default useWatchSync;
