import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import apiClient from '../../services/apiClient';
import { setCredentials } from '../../store/authSlice';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('therapistToken');
    dispatch(setCredentials({ token: null, user: null }));
  };

  const pickImage = () => {
    if (!isEditing) return;
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        uploadImage(response.assets[0]);
      }
    });
  };

  const uploadImage = async (asset) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });

      const { data } = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileImage(data.imageUrl);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'Could not upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const { data } = await apiClient.put('/auth/profile', {
        phone: editPhone,
        profileImage
      });
      dispatch(setCredentials({ token, user: data }));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    {
      title: 'Professional',
      items: [
        { icon: 'card-account-details-outline', title: 'Clinic Information', subtitle: 'Manage your workplace details' },
        { icon: 'clock-outline', title: 'Availability', subtitle: 'Set your working hours' },
        { icon: 'file-document-outline', title: 'Certifications', subtitle: 'Update your credentials' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'bell-outline', title: 'Notifications', subtitle: 'Alerts and sound settings' },
        { icon: 'lock-outline', title: 'Security', subtitle: 'Password and biometric' },
        { icon: 'help-circle-outline', title: 'Support', subtitle: 'Get help or report an issue' }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <LinearGradient
          colors={['#111827', '#374151']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => {
                if (isEditing) saveProfile();
                else setIsEditing(true);
              }} style={styles.editBtn}>
                {isSaving ? <ActivityIndicator size="small" color="#10B981" /> : (
                  <Text style={styles.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.profileImageContainer}>
              {isUploading ? (
                <View style={[styles.profileImage, { backgroundColor: '#374151' }]}>
                  <ActivityIndicator color="#10B981" size="large" />
                </View>
              ) : profileImage || user?.profileImage ? (
                <Image source={{ uri: profileImage || user?.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImage}>
                  <Icon name="account" size={60} color="#111827" />
                </View>
              )}
              {isEditing && (
                <View style={styles.editBadge}>
                  <Icon name="camera" size={16} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.name}>Dr. {user?.name || user?.email?.split('@')[0] || 'Therapist'}</Text>
            {isEditing ? (
              <View style={styles.editPhoneContainer}>
                <Icon name="phone" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.editPhoneInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <Text style={styles.specialty}>Senior Therapist • Mental Health</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>124</Text>
                <Text style={styles.headerStatLabel}>Clients</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>4.9</Text>
                <Text style={styles.headerStatLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>5y+</Text>
                <Text style={styles.headerStatLabel}>Exp</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {sections.map((section, sIdx) => (
            <View key={sIdx} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.card}>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    style={[styles.menuItem, iIdx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.menuLeft}>
                      <View style={styles.iconContainer}>
                        <Icon name={item.icon} size={22} color="#10B981" />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.4 (Build 42)</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerGradient: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerContent: { alignItems: 'center', paddingHorizontal: 24 },
  profileImageContainer: { position: 'relative', marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  name: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  specialty: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 16, marginTop: 24, width: '100%', justifyContent: 'space-around' },
  headerStat: { alignItems: 'center', flex: 1 },
  headerStatValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  headerStatLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  body: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#FAFAFA', borderRadius: 28, padding: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  menuSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 24, marginTop: 10 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '800' },
  versionText: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 24, fontWeight: '600' },
  topRow: { width: '100%', alignItems: 'flex-end', marginBottom: 10 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  editBtnText: { color: '#10B981', fontWeight: 'bold' },
  editPhoneContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, marginTop: 8, height: 40 },
  editPhoneInput: { color: '#FFF', marginLeft: 8, fontSize: 14, fontWeight: '600', minWidth: 120 }
});

export default ProfileScreen;
