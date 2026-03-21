import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const INFO_ROWS = [
  {
    icon: 'sparkles-outline',
    label: 'Type',
    value: 'AI Companion',
    color: '#818CF8',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Privacy',
    value: 'All conversations are end-to-end encrypted and never shared.',
    color: '#34D399',
  },
  {
    icon: 'heart-outline',
    label: 'Purpose',
    value:
      'To provide compassionate, non-judgmental companionship and emotional support whenever you need it.',
    color: '#F472B6',
  },
  {
    icon: 'brain-outline',
    label: 'Powered by',
    value: 'Advanced large language model fine-tuned for mental wellness.',
    color: '#FBBF24',
  },
  {
    icon: 'time-outline',
    label: 'Availability',
    value: 'Available 24 / 7 — always here for you.',
    color: '#60A5FA',
  },
  {
    icon: 'warning-outline',
    label: 'Important',
    value:
      'This AI is not a licensed therapist. For clinical support, please consult a professional.',
    color: '#FB923C',
  },
];

const ChatProfileScreen = ({ route }) => {
  const navigation  = useNavigation();
  const insets      = useSafeAreaInsets();
  const personaName = route?.params?.personaName || 'Companion';
  const themeColor  = route?.params?.themeColor  || '#2563EB';

  return (
    <View style={styles.root}>
      <StatusBar translucent={false} backgroundColor="#0B141B" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Hero */}
        <View style={styles.heroSection}>
          {/* Decorative glow ring */}
          <View style={[styles.glowRing, { borderColor: themeColor + '55' }]}>
            <View style={[styles.avatarCircle, { backgroundColor: themeColor + '22' }]}>
              <Icon name="sparkles" size={52} color={themeColor} />
            </View>
          </View>

          <Text style={styles.personaName}>{personaName}</Text>

          {/* Online pill */}
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineLabel}>Active now</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Icon name="chatbubbles-outline" size={20} color={themeColor} />
            <Text style={styles.statNum}>∞</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMid]}>
            <Icon name="time-outline" size={20} color={themeColor} />
            <Text style={styles.statNum}>24/7</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="shield-checkmark-outline" size={20} color={themeColor} />
            <Text style={styles.statNum}>100%</Text>
            <Text style={styles.statLabel}>Private</Text>
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>
            {personaName} is your personal AI companion — designed to listen, understand, and
            support you through life's ups and downs. Whether you need to vent, reflect, or
            simply talk, {personaName} is here with empathy and zero judgment.
          </Text>
        </View>

        {/* Info rows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoCard}>
            {INFO_ROWS.map((row, i) => (
              <View key={row.label}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: row.color + '20' }]}>
                    <Icon name={row.icon} size={20} color={row.color} />
                  </View>
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                </View>
                {i < INFO_ROWS.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0B141B' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingBottom:     12,
    paddingHorizontal: 14,
    backgroundColor:   '#0B141B',
  },
  backBtn:     { padding: 6, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#E9EDEF' },

  scroll: { paddingHorizontal: 16 },

  /* Hero */
  heroSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  glowRing: {
    width:        130,
    height:       130,
    borderRadius:  65,
    borderWidth:    2,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom:  16,
  },
  avatarCircle: {
    width:          114,
    height:         114,
    borderRadius:    57,
    alignItems:    'center',
    justifyContent: 'center',
  },
  personaName: {
    fontSize:   24,
    fontWeight: 'bold',
    color:      '#E9EDEF',
    marginBottom: 8,
  },
  onlinePill: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor:'#1B262E',
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      20,
  },
  onlineDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366', marginRight: 6 },
  onlineLabel:{ fontSize: 13, color: '#8696A0' },

  /* Stats */
  statsRow: {
    flexDirection:    'row',
    backgroundColor:  '#1B262E',
    borderRadius:      18,
    marginBottom:      20,
    overflow:         'hidden',
  },
  statBox: {
    flex:           1,
    alignItems:     'center',
    paddingVertical: 16,
  },
  statBoxMid: {
    borderLeftWidth:  1,
    borderRightWidth: 1,
    borderColor:      '#2D3748',
  },
  statNum:   { fontSize: 16, fontWeight: 'bold', color: '#E9EDEF', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#8696A0', marginTop: 2 },

  /* Sections */
  section:      { marginBottom: 22 },
  sectionTitle: { fontSize: 13, color: '#8696A0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  bio: { fontSize: 15, color: '#B0BEC5', lineHeight: 22 },

  /* Info card */
  infoCard:   { backgroundColor: '#1B262E', borderRadius: 18, overflow: 'hidden' },
  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  infoIconBox:{
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginTop: 2,
  },
  infoText:   { flex: 1 },
  infoLabel:  { fontSize: 12, color: '#8696A0', marginBottom: 3, fontWeight: '600' },
  infoValue:  { fontSize: 14, color: '#E9EDEF', lineHeight: 20 },
  rowDivider: { height: 1, backgroundColor: '#2D3748', marginLeft: 62 },
});

export default ChatProfileScreen;
