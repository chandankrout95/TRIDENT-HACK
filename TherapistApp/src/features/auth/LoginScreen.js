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
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password required');
    
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      
      if (res.data.token && res.data.role === 'therapist') {
        await AsyncStorage.setItem('therapistToken', res.data.token);
        dispatch(setCredentials({
          token: res.data.token,
          therapist: { _id: res.data._id, email: res.data.email, role: res.data.role }
        }));
      } else {
        Alert.alert('Error', 'Unauthorized. Must be a therapist account.');
      }
    } catch (error) {
       Alert.alert('Login failed', error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Therapist Portal</Text>
      <Text style={styles.subtitle}>Sign in to manage your practice</Text>

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
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F3F4F6' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 40 },
  input: { backgroundColor: '#FFF', color: '#111827', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#4338CA', padding: 15, borderRadius: 10, alignItems: 'center', shadowColor: '#4338CA', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default LoginScreen;
