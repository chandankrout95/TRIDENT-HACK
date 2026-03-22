import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, StatusBar, ScrollView, Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import apiClient from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const REQUIRED_DOCS = [
  { type: 'medical_license', label: 'Medical License', icon: 'document-text', color: '#10B981' },
  { type: 'degree_certificate', label: 'Degree Certificate', icon: 'school', color: '#3B82F6' },
  { type: 'government_id', label: 'Government ID', icon: 'card', color: '#F59E0B' },
];

const DocumentUploadScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const isReapply = route?.params?.isReapply || false;
  const [documents, setDocuments] = useState({});
  const [uploading, setUploading] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickAndUpload = async (docType) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets?.length) return;

      const file = result.assets[0];
      setUploading(prev => ({ ...prev, [docType]: true }));

      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `${docType}.jpg`,
      });
      formData.append('documentType', docType);

      const res = await apiClient.post('/therapist/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      setDocuments(prev => ({
        ...prev,
        [docType]: {
          uri: file.uri,
          name: file.fileName,
          uploaded: true,
          serverDoc: res.data.document,
        },
      }));

      Alert.alert('Success', `${REQUIRED_DOCS.find(d => d.type === docType)?.label} uploaded successfully`);
    } catch (error) {
      Alert.alert('Upload Failed', error.response?.data?.message || error.message);
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleSubmit = async () => {
    const uploadedTypes = Object.keys(documents).filter(k => documents[k]?.uploaded);
    const missingDocs = REQUIRED_DOCS.filter(d => !uploadedTypes.includes(d.type));

    if (missingDocs.length > 0) {
      return Alert.alert('Missing Documents', `Please upload: ${missingDocs.map(d => d.label).join(', ')}`);
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/therapist/submit-application');

      // Fetch updated profile status (should now be 'pending')
      // Update local state to trigger navigation
      const { data: me } = await apiClient.get('/auth/me');
      dispatch(setCredentials({ token, user: me }));
      // AppNavigator will automatically switch to WaitingApprovalScreen
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F3FF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{isReapply ? 'Reapply' : 'Step 2 of 2'}</Text>
          </View>
          <View style={styles.iconBadge}>
            <Icon name="cloud-upload" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>Upload your verification documents</Text>
        </View>

        {/* Document Cards */}
        {REQUIRED_DOCS.map(doc => {
          const uploaded = documents[doc.type]?.uploaded;
          const isUploading = uploading[doc.type];

          return (
            <TouchableOpacity
              key={doc.type}
              style={[styles.docCard, uploaded && styles.docCardUploaded]}
              onPress={() => pickAndUpload(doc.type)}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <View style={[styles.docIconContainer, { backgroundColor: `${doc.color}15` }]}>
                {isUploading ? (
                  <ActivityIndicator color={doc.color} />
                ) : (
                  <Icon name={doc.icon} size={24} color={doc.color} />
                )}
              </View>

              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docStatus}>
                  {isUploading ? 'Uploading...' : uploaded ? 'Uploaded ✓' : 'Tap to upload'}
                </Text>
              </View>

              {uploaded ? (
                <View style={styles.checkBadge}>
                  <Icon name="checkmark-circle" size={24} color="#10B981" />
                </View>
              ) : (
                <Icon name="add-circle-outline" size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Info note */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            Accepted formats: JPG, PNG, PDF. All documents will be encrypted and securely stored.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit Application</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginBottom: 28, marginTop: 40 },
  stepBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  stepText: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },
  iconBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E1B4B', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  docCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  docCardUploaded: { borderColor: '#10B981', borderStyle: 'solid', backgroundColor: '#F0FDF4' },
  docIconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 15, fontWeight: '600', color: '#1E1B4B', marginBottom: 2 },
  docStatus: { fontSize: 13, color: '#9CA3AF' },
  checkBadge: {},
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EEF2FF',
    borderRadius: 12, padding: 14, marginTop: 12, marginBottom: 24, gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 18 },
  submitButton: {
    backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});

export default DocumentUploadScreen;
