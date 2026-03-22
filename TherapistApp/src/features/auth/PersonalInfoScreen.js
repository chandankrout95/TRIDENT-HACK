import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSelector, useDispatch } from 'react-redux';
import apiClient from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import { setCredentials } from '../../store/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector(state => state.auth);

  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleDobChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 8) clean = clean.substring(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.substring(0, 2) + '/' + clean.substring(2);
    if (clean.length > 4) formatted = formatted.substring(0, 5) + '/' + clean.substring(4);
    setDob(formatted);
  };

  const handleSubmit = async () => {
    if (!qualification || !experience || !specialization) {
      return Alert.alert('Error', 'Qualification, experience, and specialization are required');
    }

    setIsLoading(true);
    try {
      const payload = { qualification, experience, specialization, bio };
      if (age) payload.age = parseInt(age);
      if (dob) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          payload.dob = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
        }
      }

      await apiClient.post('/therapist/personal-info', payload);
      
      // Fetch updated profile and update Redux to trigger automatic navigation
      const meRes = await apiClient.get('/auth/me');
      dispatch(setCredentials({
        token: token,
        user: meRes.data,
      }));
      // Don't need to manually navigate; AppNavigator catches the updated state.
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save information');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (icon, placeholder, value, setValue, options = {}) => (
    <View style={styles.inputWrapper}>
      <Icon name={icon} size={20} color="#9CA3AF" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={setValue}
        {...options}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3FF" />
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} enableOnAndroid showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.stepBadge}><Text style={styles.stepText}>Step 1 of 2</Text></View>
          <View style={styles.iconBadge}>
            <Icon name="school" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.title}>Professional Info</Text>
          <Text style={styles.subtitle}>Tell us about your qualifications</Text>
        </View>

        <View style={styles.formCard}>
          {renderInput('ribbon-outline', 'Qualification (e.g. MD Psychiatry)', qualification, setQualification)}
          {renderInput('time-outline', 'Experience (e.g. 5 years clinical)', experience, setExperience)}
          {renderInput('medical-outline', 'Specialization (e.g. Anxiety, CBT)', specialization, setSpecialization)}
          {renderInput('calendar-outline', 'Age', age, setAge, { keyboardType: 'numeric', maxLength: 3 })}
          {renderInput('today-outline', 'Date of Birth (DD/MM/YYYY)', dob, handleDobChange, { keyboardType: Platform.OS === 'ios' ? 'default' : 'numeric', maxLength: 10 })}

          <View style={[styles.inputWrapper, { minHeight: 80, alignItems: 'flex-start', paddingTop: 14 }]}>
            <Icon name="document-text-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput style={[styles.input, { textAlignVertical: 'top' }]} placeholder="Bio — describe your approach and experience..."
              placeholderTextColor="#9CA3AF" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
          </View>

          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonText}>Next: Upload Documents</Text>
                <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginBottom: 28 },
  stepBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  stepText: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },
  iconBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E1B4B', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  formCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, shadowColor: '#7C3AED', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#111827' },
  button: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});

export default PersonalInfoScreen;
