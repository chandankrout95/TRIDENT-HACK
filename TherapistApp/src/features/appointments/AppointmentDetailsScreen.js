import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socket';

const AppointmentDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const session = route?.params?.session || {};
  const client = session.user || {};

  const [currentStatus, setCurrentStatus] = useState(session.status || 'pending');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onStatusUpdate = (updatedSess) => {
      if (updatedSess._id === session._id) {
        setCurrentStatus(updatedSess.status);
      }
    };
    socket.on('session_status_update', onStatusUpdate);
    return () => socket.off('session_status_update', onStatusUpdate);
  }, [session._id]);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-circle' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706', icon: 'time' };
      case 'completed': return { bg: '#DBEAFE', text: '#2563EB', icon: 'checkmark-done' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle' };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: 'ellipse' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const sc = getStatusColor(currentStatus);

  const handleUpdateStatus = async (newStatus) => {
    Alert.alert(
      `Confirm ${newStatus === 'confirmed' ? 'Acceptance' : 'Rejection'}`,
      `Are you sure you want to ${newStatus === 'confirmed' ? 'accept' : 'reject'} this appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await apiClient.put(`/therapist/sessions/${session._id}/status`, { status: newStatus });
              setCurrentStatus(newStatus);
              Alert.alert('Success', `Session has been ${newStatus}.`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update session.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteSession = async () => {
    if (otpValue.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit completion code provided by the client.');
      return;
    }
    setIsProcessing(true);
    try {
      await apiClient.put(`/therapist/sessions/${session._id}/complete`, { otp: otpValue });
      setCurrentStatus('completed');
      setShowOtpModal(false);
      Alert.alert('Session Completed', 'The session has been successfully closed and recorded.');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'The OTP entered is incorrect.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Icon name={sc.icon} size={28} color={sc.text} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.statusTitle, { color: sc.text }]}>
              {currentStatus === 'confirmed' ? 'Appointment Confirmed' :
                currentStatus === 'pending' ? 'Action Required' :
                  currentStatus === 'completed' ? 'Session Completed' : 'Appointment Cancelled'}
            </Text>
            <Text style={[styles.statusSub, { color: sc.text }]}>
              {currentStatus === 'pending' ? 'Please accept or reject this request.' :
                currentStatus === 'confirmed' ? 'Wait for the scheduled time to connect.' :
                  currentStatus === 'completed' ? 'This appointment has concluded.' : 'This session was rejected/cancelled.'}
            </Text>
          </View>
        </View>

        {/* Client Card */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{(client.name || client.email || 'C').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{client.name || client.email || 'Unknown Client'}</Text>
            <Text style={styles.clientMeta}>Client ID: {String(client._id || '').substring(0, 8)}</Text>
            {client.phone && (
              <View style={styles.metaRow}>
                <Icon name="call" size={12} color="#6B7280" />
                <Text style={styles.metaText}>{client.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Appointment Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Scheduling Details</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Icon name="calendar" size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(session.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Icon name="time" size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Time Slot</Text>
              <Text style={styles.infoValue}>{session.timeSlot || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.infoIconBox}>
              <Icon name="videocam" size={22} color="#10B981" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Consultation Mode</Text>
              <Text style={styles.infoValue}>Video Call</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {session.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Client Notes</Text>
            <View style={styles.notesBox}>
              <Icon name="reader" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Action Buttons (Floating Bottom) */}
      <View style={styles.bottomBar}>
        {currentStatus === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn, isProcessing && { opacity: 0.5 }]} 
              onPress={() => handleUpdateStatus('cancelled')}
              disabled={isProcessing}
            >
              <Icon name="close" size={20} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn, isProcessing && { opacity: 0.5 }]} 
              onPress={() => handleUpdateStatus('confirmed')}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Icon name="checkmark" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.acceptBtnText}>Accept Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {currentStatus === 'confirmed' && (
          <>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('ChatScreen', {
                persona: client.name || client.email || 'Client',
                personaColor: '#4338CA',
                clientId: client._id,
              })}
            >
              <Icon name="chatbubbles" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => navigation.navigate('CallingScreen', {
                personaName: client.name || client.email || 'Client',
                themeColor: '#4338CA',
                channelName: `session_${session._id}`,
                receiverId: client._id,
              })}
            >
              <Icon name="videocam" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.completeBtn]} 
              onPress={() => setShowOtpModal(true)}
            >
              <Icon name="flag" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.completeBtnText}>Mark Completed</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* OTP Completion Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Session</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={{ padding: 4 }}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDesc}>
              Ask the client for the 4-digit completion OTP visible on their Appointment screen to formally close this session.
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              keyboardType="number-pad"
              maxLength={4}
              value={otpValue}
              onChangeText={setOtpValue}
              textAlign="center"
              editable={!isProcessing}
            />

            <TouchableOpacity 
              style={[styles.verifyBtn, (otpValue.length !== 4 || isProcessing) && { opacity: 0.5 }]}
              onPress={handleCompleteSession}
              disabled={otpValue.length !== 4 || isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify & Complete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  statusBanner: { flexDirection: 'row', alignItems: 'center', margin: 20, padding: 18, borderRadius: 16 },
  statusTitle: { fontSize: 16, fontWeight: 'bold' },
  statusSub: { fontSize: 13, marginTop: 3, opacity: 0.8 },

  clientCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 18, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  clientAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4338CA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  clientAvatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  clientMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 13, color: '#6B7280', marginLeft: 4, fontWeight: '500' },

  infoSection: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' },
  infoValue: { fontSize: 16, color: '#111827', fontWeight: '600', marginTop: 3 },

  notesSection: { marginHorizontal: 20, marginBottom: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12 },
  notesText: { fontSize: 14, color: '#6B7280', flex: 1, lineHeight: 20 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', gap: 12, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  rejectBtnText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  
  acceptBtn: { backgroundColor: '#10B981', elevation: 2, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8 },
  acceptBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },

  completeBtn: { backgroundColor: '#4338CA', elevation: 2, shadowColor: '#4338CA', shadowOpacity: 0.3, shadowRadius: 8 },
  completeBtnText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },

  chatBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  callBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  otpInput: { backgroundColor: '#F3F4F6', borderRadius: 12, fontSize: 28, fontWeight: 'bold', letterSpacing: 8, paddingVertical: 16, color: '#111827', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 24 },
  verifyBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3 },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default AppointmentDetailsScreen;
