import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { setCredentials } from '../../store/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const UserInfoScreen = ({ route }) => {
  const { name: initialName } = route?.params || {};
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);

  const [name, setName] = useState(initialName || user?.name || '');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [hobby, setHobby] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDobChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 8) clean = clean.substring(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.substring(0, 2) + '/' + clean.substring(2);
    if (clean.length > 4) formatted = formatted.substring(0, 5) + '/' + clean.substring(4);
    setDob(formatted);
  };

  const handleSubmit = async () => {
    if (!name || !age) {
      return Alert.alert('Error', 'Name and age are required');
    }

    setIsLoading(true);
    try {
      const payload = {
        name,
        age: parseInt(age),
        hobby,
        occupation,
        bio,
      };

      if (dob) {
        // Parse DD/MM/YYYY to ISO
        const parts = dob.split('/');
        if (parts.length === 3) {
          payload.dob = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
        }
      }

      const res = await apiClient.put('/auth/user-info', payload);

      // Update Redux with complete profile
      dispatch(setCredentials({
        token,
        user: { ...user, ...res.data.user, isProfileComplete: true },
      }));

      // No navigation needed — AppNavigator will detect isProfileComplete and show main app
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
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconBadge}>
            <Icon name="clipboard" size={28} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {renderInput('person-outline', 'Full Name', name, setName, { autoCapitalize: 'words' })}
          {renderInput('calendar-outline', 'Age', age, setAge, { keyboardType: 'numeric', maxLength: 3 })}
          {renderInput('today-outline', 'Date of Birth (DD/MM/YYYY)', dob, handleDobChange, { keyboardType: Platform.OS === 'ios' ? 'default' : 'numeric', maxLength: 10 })}
          {renderInput('color-palette-outline', 'Hobbies & Interests', hobby, setHobby)}
          {renderInput('briefcase-outline', 'Occupation', occupation, setOccupation)}

          <View style={[styles.inputWrapper, { minHeight: 80, alignItems: 'flex-start', paddingTop: 14 }]}>
            <Icon name="document-text-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { textAlignVertical: 'top' }]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default UserInfoScreen;
