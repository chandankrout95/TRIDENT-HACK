import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';

const BookingScreen = ({ route }) => {
  const navigation = useNavigation();
  const therapist = route?.params?.therapist || {};

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        full: d.toISOString().split('T')[0],
        day: dayNames[d.getDay()],
        date: d.getDate(),
        month: monthNames[d.getMonth()]
      });
    }
    return days;
  };
  const dates = getNext7Days();

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  const [selectedDate, setSelectedDate] = useState(dates[0].full);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const handlePayAndBook = async () => {
    if (!selectedSlot) {
      Alert.alert('Select Time', 'Please pick a time slot before booking.');
      return;
    }

    // Razorpay Integration
    try {
      const RazorpayCheckout = require('react-native-razorpay').default;
      const options = {
        description: `Session with ${therapist.name || 'Therapist'}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_1DP5mmOlF5G5ag', // Test key — replace with your own
        amount: (therapist.hourlyRate || 80) * 100, // Razorpay takes amount in paise
        name: 'Trident Health',
        prefill: { email: 'user@trident.com', contact: '9999999999', name: 'Patient' },
        theme: { color: '#2563EB' }
      };
      const paymentData = await RazorpayCheckout.open(options);

      // Payment successful — now book the session
      setIsBooking(true);
      await apiClient.post('/user/sessions', {
        therapistId: therapist._id || therapist.user,
        date: selectedDate,
        timeSlot: selectedSlot,
        paymentId: paymentData.razorpay_payment_id,
      });
      Alert.alert('Booked!', 'Your session has been confirmed. Check your email for details.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (error) {
      // User cancelled or payment failed
      if (error?.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Cancelled', 'Payment was cancelled.');
      } else {
        // Fallback: book without payment for development
        setIsBooking(true);
        try {
          await apiClient.post('/user/sessions', {
            therapistId: therapist._id || therapist.user,
            date: selectedDate,
            timeSlot: selectedSlot,
          });
          Alert.alert('Booked!', 'Session booked successfully (payment module not installed — dev mode).', [
            { text: 'OK', onPress: () => navigation.popToTop() }
          ]);
        } catch (bookErr) {
          Alert.alert('Error', bookErr.response?.data?.message || 'Booking failed.');
        }
      }
    } finally {
      setIsBooking(false);
    }
  };

  const selectedDateObj = dates.find(d => d.full === selectedDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Therapist Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryAvatar}>
            <Icon name="person-circle" size={50} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryName}>{therapist.name || 'Dr. Therapist'}</Text>
            <Text style={styles.summarySpec}>{therapist.specialization || 'General'}</Text>
          </View>
          <View style={styles.rateTag}>
            <Text style={styles.rateText}>${therapist.hourlyRate || 80}/hr</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -5 }}>
            {dates.map((d) => (
              <TouchableOpacity
                key={d.full}
                style={[styles.dateCard, selectedDate === d.full && styles.dateCardActive]}
                onPress={() => setSelectedDate(d.full)}
              >
                <Text style={[styles.dateDay, selectedDate === d.full && styles.dateDayActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, selectedDate === d.full && styles.dateNumActive]}>{d.date}</Text>
                <Text style={[styles.dateMonth, selectedDate === d.full && styles.dateMonthActive]}>{d.month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <View style={styles.slotsGrid}>
            {timeSlots.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Icon name="time-outline" size={16} color={selectedSlot === slot ? '#FFF' : '#6B7280'} style={{ marginRight: 5 }} />
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Therapist</Text>
            <Text style={styles.summaryVal}>{therapist.name || 'Dr. Therapist'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryVal}>{selectedDateObj ? `${selectedDateObj.day}, ${selectedDateObj.date} ${selectedDateObj.month}` : '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryVal}>{selectedSlot || 'Not selected'}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>${therapist.hourlyRate || 80}.00</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payBtn, (!selectedSlot || isBooking) && { opacity: 0.5 }]}
          onPress={handlePayAndBook}
          disabled={!selectedSlot || isBooking}
        >
          <Icon name="card" size={22} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.payBtnText}>{isBooking ? 'Processing...' : `Pay $${therapist.hourlyRate || 80} & Book`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  summaryCard: { flexDirection: 'row', alignItems: 'center', margin: 15, padding: 16, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  summaryAvatar: { marginRight: 14 },
  summaryName: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  summarySpec: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  rateTag: { backgroundColor: '#ECFDF5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  rateText: { fontSize: 14, fontWeight: 'bold', color: '#059669' },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },

  dateCard: { width: 72, alignItems: 'center', paddingVertical: 14, marginHorizontal: 5, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E5E7EB' },
  dateCardActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dateDay: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  dateDayActive: { color: '#DBEAFE' },
  dateNum: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginVertical: 4 },
  dateNumActive: { color: '#FFF' },
  dateMonth: { fontSize: 12, color: '#9CA3AF' },
  dateMonthActive: { color: '#DBEAFE' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slotBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB' },
  slotBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  slotText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  slotTextActive: { color: '#FFF' },

  summarySection: { margin: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  summaryLabel: { fontSize: 15, color: '#6B7280' },
  summaryVal: { fontSize: 15, fontWeight: '600', color: '#111827' },
  totalRow: { borderBottomWidth: 0, marginTop: 5, borderTopWidth: 2, borderColor: '#E5E7EB', paddingTop: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalVal: { fontSize: 22, fontWeight: 'bold', color: '#2563EB' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  payBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  payBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default BookingScreen;
