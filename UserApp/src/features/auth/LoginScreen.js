import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import apiClient from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../../store/authSlice';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch(); // normally used for loginUser thunk if doing direct login

  const handleLogin = async () => {
    if (!email) return Alert.alert('Error', 'Email is required');

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });

      // If backend says OTP sent
      if (res.data.message === 'OTP sent to email') {
        navigation.navigate('VerifyOtp', { email });
      } else if (res.data.token) {
        // Direct password login success
        await AsyncStorage.setItem('userToken', res.data.token);
        dispatch(setCredentials({
          token: res.data.token,
          user: res.data.user || { email }
        }));
      }
    } catch (error) {
      Alert.alert('Login failed', error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (optional for OTP)"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F9FAFB' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 40 },
  input: { backgroundColor: '#FFF', color: '#111827', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10, alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default LoginScreen;
