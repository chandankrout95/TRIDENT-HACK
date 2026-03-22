import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch } from 'react-redux';
import apiClient from '../../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password are required');

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });

      if (res.data.token && res.data.user?.role === 'therapist') {
        await AsyncStorage.setItem('therapistToken', res.data.token);
        dispatch(setCredentials({
          token: res.data.token,
          therapist: res.data.user,
        }));
        // AppNavigator will handle routing based on therapist status
      } else {
        Alert.alert('Error', 'This account is not a therapist account.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      if (error.response?.data?.needsVerification) {
        Alert.alert('Email Not Verified', 'Please verify your email to continue.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify Now',
            onPress: async () => {
              try {
                await apiClient.post('/auth/resend-otp', { email });
                navigation.navigate('VerifyOtp', { email });
              } catch (e) {
                Alert.alert('Error', 'Failed to resend OTP');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Login Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3FF" />
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} enableOnAndroid showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.iconBadge}>
            <Icon name="medkit" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.title}>Therapist Portal</Text>
          <Text style={styles.subtitle}>Sign in to manage your practice</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#9CA3AF"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor="#9CA3AF"
              value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  iconBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E1B4B', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  formCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#7C3AED', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 8 },
  button: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#7C3AED', fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
