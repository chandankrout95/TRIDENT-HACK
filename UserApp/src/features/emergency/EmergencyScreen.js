import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socket';

const FALLBACK_SPECIALISTS = [
  { _id: '1', role: 'Anxiety & Panic Specialist', icon: 'pulse', color: '#059669', desc: 'Immediate psychological support', phoneNumber: '9937353078' },
  { _id: '2', role: 'General Trauma Doctor', icon: 'medkit', color: '#2563EB', desc: 'Critical physical & mental care', phoneNumber: '9937353078' },
  { _id: '3', role: 'Depression & Crisis Counselor', icon: 'heart-half', color: '#D97706', desc: 'Safe, confidential intervention', phoneNumber: '9937353078' },
  { _id: '4', role: 'Pediatric Care Specialist', icon: 'happy', color: '#8B5CF6', desc: 'Emergency child health support', phoneNumber: '9937353078' },
];

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const [specialists, setSpecialists] = useState(FALLBACK_SPECIALISTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await apiClient.get('/user/emergency-contacts');
        if (res.data && res.data.length > 0) {
          setSpecialists(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch emergency contacts, using fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();

    // Listen for real-time updates from admin
    const socket = getSocket();
    const onUpdate = (updatedContacts) => {
      if (updatedContacts && updatedContacts.length > 0) {
        setSpecialists(updatedContacts);
      }
    };
    socket?.on('emergency_contacts_updated', onUpdate);

    return () => {
      socket?.off('emergency_contacts_updated', onUpdate);
    };
  }, []);

  const handleCall = (phoneNumber) => {
    let phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) => {
      console.error("Failed to open dialer", err);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Assistance</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Urgent Banner */}
        <View style={styles.urgentBanner}>
          <Icon name="warning" size={40} color="#DC2626" style={{ marginBottom: 10 }} />
          <Text style={styles.urgentTitle}>Are you in a Life-Threatening Crisis?</Text>
          <Text style={styles.urgentSub}>If you or someone else is in immediate danger, or experiencing a medical emergency, do not wait.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleCall('112')}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.actionCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.actionIconBox}>
                <Icon name="medical" size={32} color="#DC2626" />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>Call National Ambulance</Text>
                <Text style={styles.actionDialText}>Dial 112</Text>
              </View>
              <Icon name="call" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* On-Call Specialists Section */}
        <View style={styles.doctorsSection}>
          <Text style={styles.sectionTitle}>Tap to Connect Direct</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#DC2626" style={{ marginVertical: 20 }} />
          ) : (
            specialists.map(spec => (
              <View key={spec._id} style={styles.doctorCard}>
                <View style={[styles.docAvatar, { backgroundColor: spec.color + '1A' }]}>
                  <Icon name={spec.icon} size={24} color={spec.color} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{spec.role}</Text>
                  <Text style={styles.docSpec}>{spec.desc} • 24x7</Text>
                </View>
                <TouchableOpacity
                  style={[styles.callDocBtn, { backgroundColor: spec.color }]}
                  activeOpacity={0.8}
                  onPress={() => handleCall(spec.phoneNumber)}
                >
                  <Icon name="call" size={18} color="#FFF" />
                  <Text style={styles.callDocText}>Call</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Information Grid */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>What to Expect</Text>
          <View style={styles.infoRow}>
            <Icon name="time" size={24} color="#4B5563" style={styles.infoIcon} />
            <Text style={styles.infoText}>Therapists are available <Text style={{ fontWeight: 'bold' }}>24 hours a day, 7 days a week</Text> to assist with urgent mental health situations.</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark" size={24} color="#4B5563" style={styles.infoIcon} />
            <Text style={styles.infoText}>All crisis calls are completely confidential and prioritized immediately by on-call professionals.</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default EmergencyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  urgentBanner: {
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 24,
  },
  urgentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  urgentSub: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionSection: {
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  actionIconBox: {
    backgroundColor: '#FFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionDialText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600'
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  doctorsSection: {
    marginBottom: 32,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  docSpec: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  callDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  callDocText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  }
});
