import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import apiClient from '../../services/apiClient';

const SubHeader = ({ title, right }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 36 }}>{right}</View>
    </View>
  );
};

export const PersonalInfoEditScreen = () => {
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const therapistProfile = user?.therapistProfile || {};

  const [name, setName] = useState(user?.name || user?.email?.split('@')[0] || 'User');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [dob, setDob] = useState(() => {
    if (therapistProfile?.dob) {
      const d = new Date(therapistProfile.dob);
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return '';
  });
  const [age, setAge] = useState(therapistProfile?.age?.toString() || '');
  const [qualification, setQualification] = useState(therapistProfile?.qualification || '');
  const [specialization, setSpecialization] = useState(therapistProfile?.specialization || '');
  const [experience, setExperience] = useState(therapistProfile?.experience?.toString() || '');
  const [bio, setBio] = useState(therapistProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(therapistProfile?.hourlyRate?.toString() || '');
  const [languages, setLanguages] = useState(therapistProfile?.languages?.join(', ') || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleDobChange = (text) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 8) clean = clean.substring(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.substring(0, 2) + '/' + clean.substring(2);
    if (clean.length > 4) formatted = formatted.substring(0, 5) + '/' + clean.substring(4);
    setDob(formatted);
  };

  const save = async () => {
    setIsLoading(true);
    try {
      // 1. Update User basic info
      const userPayload = { name, phone };
      await apiClient.put('/auth/profile', userPayload);
      
      // 2. Update Therapist Profile info
      const therapistPayload = {
        qualification,
        specialization,
        experience: parseInt(experience) || 0,
        bio,
        age: parseInt(age) || undefined,
        hourlyRate: parseFloat(hourlyRate) || 0,
        languages: languages.split(',').map(l => l.trim()).filter(l => l !== ''),
      };
      
      if (dob && dob.length === 10) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          therapistPayload.dob = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
        }
      }
      
      await apiClient.post('/therapist/personal-info', therapistPayload);
      
      const meRes = await apiClient.get('/auth/me');
      dispatch(setCredentials({ token, therapist: meRes.data }));
      Alert.alert('Success', 'Your information has been updated.');
    } catch(err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Edit Profile Info" right={
        <TouchableOpacity onPress={save} disabled={isLoading}>
          <Text style={{ color: isLoading ? '#9CA3AF' : '#10B981', fontWeight: '700', fontSize: 16 }}>{isLoading ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput style={[styles.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]} value={email} editable={false} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" maxLength={3} />
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TextInput style={styles.input} value={dob} onChangeText={handleDobChange} placeholder="DD/MM/YYYY" keyboardType="numeric" maxLength={10} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Qualification</Text>
          <TextInput style={styles.input} value={qualification} onChangeText={setQualification} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Specialization</Text>
          <TextInput style={styles.input} value={specialization} onChangeText={setSpecialization} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Years of Experience</Text>
          <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Professional Bio</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline numberOfLines={4} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Hourly Rate ($)</Text>
          <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" placeholder="e.g. 50" />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Languages (comma separated)</Text>
          <TextInput style={styles.input} value={languages} onChangeText={setLanguages} placeholder="e.g. English, Hindi" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F9FAFB' },
  scroll:{ padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  backBtn: { padding: 6, marginRight: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#111827' },
  field:       { marginBottom: 16 },
  fieldLabel:  { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  input:       { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
});
