import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const AppointmentDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const session = route?.params?.session || {};
  const therapist = session.therapist || {};

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
    const d = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const sc = getStatusColor(session.status);
  const isUpcoming = session.status === 'confirmed' || session.status === 'pending';

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: () => {
          Alert.alert('Cancelled', 'Your appointment has been cancelled.');
          navigation.goBack();
        }
      },
    ]);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Icon name={sc.icon} size={28} color={sc.text} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.statusTitle, { color: sc.text }]}>
              {session.status === 'confirmed' ? 'Appointment Confirmed' :
                session.status === 'pending' ? 'Awaiting Confirmation' :
                  session.status === 'completed' ? 'Session Completed' : 'Appointment Cancelled'}
            </Text>
            <Text style={[styles.statusSub, { color: sc.text }]}>
              {isUpcoming ? 'Your session is scheduled' : session.status === 'completed' ? 'Thank you for attending' : 'This session was cancelled'}
            </Text>
          </View>
        </View>

        {/* Therapist Card */}
        <TouchableOpacity
          style={styles.therapistCard}
          onPress={() => therapist.name && navigation.navigate('TherapistProfileScreen', { therapist })}
        >
          <View style={styles.therapistAvatar}>
            <Icon name="person-circle" size={56} color="#4338CA" />
          </View>
          <View style={styles.therapistInfo}>
            <Text style={styles.therapistName}>{therapist.name || 'Therapist'}</Text>
            <Text style={styles.therapistSpec}>{therapist.specialization || 'General'}</Text>
            {therapist.rating && (
              <View style={styles.ratingRow}>
                <Icon name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{therapist.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Icon name="chevron-forward" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Appointment Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>

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

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Icon name="videocam" size={22} color="#10B981" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Session Type</Text>
              <Text style={styles.infoValue}>Video Consultation</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Icon name="cash" size={22} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Consultation Fee</Text>
              <Text style={styles.infoValue}>${therapist.hourlyRate || 80}.00</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesBox}>
            <Icon name="document-text-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <Text style={styles.notesText}>{session.notes || 'No notes added for this session.'}</Text>
          </View>
        </View>

        {/* Preparation Tips (for upcoming) */}
        {isUpcoming && (
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Preparation Tips</Text>
            {[
              'Find a quiet, private space for your session',
              'Test your camera and microphone beforehand',
              'Prepare any topics you want to discuss',
              'Have a glass of water ready',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Icon name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 12 }} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {isUpcoming && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Icon name="close-circle-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatScreen', {
              persona: therapist.name || 'Therapist',
              personaColor: '#4338CA',
              therapistId: therapist.user || therapist._id,
            })}
          >
            <Icon name="chatbubbles" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => navigation.navigate('CallingScreen', {
              personaName: therapist.name || 'Therapist',
              themeColor: '#4338CA',
              channelName: `session_${session._id}`,
              receiverId: therapist.user || therapist._id,
            })}
          >
            <Icon name="call" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', margin: 20, padding: 18, borderRadius: 16 },
  statusTitle: { fontSize: 16, fontWeight: 'bold' },
  statusSub: { fontSize: 13, marginTop: 3, opacity: 0.8 },

  therapistCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 18, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  therapistAvatar: { marginRight: 14 },
  therapistInfo: { flex: 1 },
  therapistName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  therapistSpec: { fontSize: 14, color: '#6B7280', marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingText: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginLeft: 4 },

  infoSection: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' },
  infoValue: { fontSize: 16, color: '#111827', fontWeight: '600', marginTop: 3 },

  notesSection: { marginHorizontal: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12 },
  notesText: { fontSize: 14, color: '#6B7280', flex: 1, lineHeight: 20 },

  tipsSection: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tipText: { fontSize: 14, color: '#374151', flex: 1 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', gap: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cancelBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  cancelBtnText: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
  chatBtn: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#2563EB', elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  chatBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  callBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8 },
});

export default AppointmentDetailScreen;
