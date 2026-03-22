import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const TherapistProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const therapist = route?.params?.therapist || {};

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon key={i} name={i <= Math.round(rating || 4.5) ? 'star' : 'star-outline'} size={20} color="#F59E0B" />
      );
    }
    return stars;
  };

  const infoItems = [
    { icon: 'briefcase-outline', label: 'Experience', value: `${therapist.yearsExperience || 5} years` },
    { icon: 'cash-outline', label: 'Hourly Rate', value: `₹${therapist.hourlyRate || 80}` },
    { icon: 'chatbubbles-outline', label: 'Languages', value: (therapist.languages || ['English']).join(', ') },
    { icon: 'people-outline', label: 'Reviews', value: `${therapist.reviewCount || 0} reviews` },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Therapist Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Icon name="person" size={60} color="#2563EB" />
          </View>
          <Text style={styles.name}>{therapist.name || 'Dr. Therapist'}</Text>
          <View style={styles.specBadge}>
            <Icon name="medical" size={14} color="#2563EB" style={{ marginRight: 5 }} />
            <Text style={styles.specBadgeText}>{therapist.specialization || 'General'}</Text>
          </View>
          <View style={styles.ratingRow}>
            {renderStars(therapist.rating)}
            <Text style={styles.ratingText}>{(therapist.rating || 4.5).toFixed(1)}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {infoItems.map((item, i) => (
            <View key={i} style={styles.infoCard}>
              <Icon name={item.icon} size={24} color="#4338CA" style={{ marginBottom: 8 }} />
              <Text style={styles.infoValue}>{item.value}</Text>
              <Text style={styles.infoLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{therapist.bio || 'No bio available.'}</Text>
        </View>

        {/* Availability Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.dayRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
              <View key={i} style={[styles.dayChip, i < 3 && styles.dayChipActive]}>
                <Text style={[styles.dayText, i < 3 && styles.dayTextActive]}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Reviews</Text>
          {[
            { name: 'Sarah M.', text: 'Incredibly empathetic and professional. Changed my life.', stars: 5 },
            { name: 'Raj P.', text: 'Very patient, listens deeply. Highly recommend.', stars: 5 },
            { name: 'Emma L.', text: 'Helped me work through years of anxiety. Amazing.', stars: 4 },
          ].map((review, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Icon name="person" size={20} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {Array.from({ length: review.stars }).map((_, j) => (
                      <Icon key={j} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Consultation Fee</Text>
          <Text style={styles.priceValue}>₹{therapist.hourlyRate || 80}/hour</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('BookingScreen', { therapist })}
        >
          <Icon name="calendar" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#2563EB' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  heroSection: { alignItems: 'center', backgroundColor: '#2563EB', paddingBottom: 35, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatarLarge: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#FFF' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  specBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  specBadgeText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  ratingText: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 8 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, marginTop: -20, justifyContent: 'space-between' },
  infoCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  infoLabel: { fontSize: 12, color: '#6B7280' },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  bioText: { fontSize: 15, lineHeight: 24, color: '#4B5563' },

  dayRow: { flexDirection: 'row', gap: 10 },
  dayChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#E5E7EB' },
  dayChipActive: { backgroundColor: '#DBEAFE' },
  dayText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  dayTextActive: { color: '#2563EB' },

  reviewCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reviewName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  reviewText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  priceLabel: { fontSize: 12, color: '#6B7280' },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default TherapistProfileScreen;
