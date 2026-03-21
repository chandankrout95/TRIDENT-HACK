import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import apiClient from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../../store/authSlice';
import { useNavigation } from '@react-navigation/native';

const VerifyOtpScreen = ({ route }) => {
  const navigation = useNavigation();
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleVerify = async () => {
    if (otp.length !== 6) return Alert.alert('Error', 'OTP must be 6 digits');

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
        dispatch(setCredentials({
          token: res.data.token,
          user: res.data.user || { email }
        }));
      }
    } catch (error) {
      Alert.alert('Verification failed', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        placeholderTextColor="#D1D5DB"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F9FAFB' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 40 },
  input: { backgroundColor: '#FFF', color: '#111827', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 20, fontSize: 32, textAlign: 'center', letterSpacing: 10 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});


export default VerifyOtpScreen;
