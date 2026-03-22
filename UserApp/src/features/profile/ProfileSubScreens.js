import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Switch, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import apiClient from '../../services/apiClient';

// ─── Shared header used by all sub-screens ─────────────────────────────────
const SubHeader = ({ title, right }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[sh.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={sh.backBtn}>
        <Icon name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={sh.title}>{title}</Text>
      <View style={{ width: 36 }}>{right}</View>
    </View>
  );
};

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  backBtn: { padding: 6, marginRight: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#111827' },
});

// ─── 1. Personal Information ────────────────────────────────────────────────
export const PersonalInfoScreen = () => {
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState(user?.name || user?.email?.split('@')[0] || 'User');
  const [email] = useState(user?.email || ''); // Readonly
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [dob, setDob] = useState(() => {
    if (user?.dob) {
      const d = new Date(user.dob);
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    return '';
  });
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [hobby, setHobby] = useState(user?.hobby || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [bio, setBio] = useState(user?.bio || '');
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
      const payload = { name, phone, hobby, occupation, bio, age: parseInt(age) || undefined };
      if (dob && dob.length === 10) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          payload.dob = new Date(parts[2], parts[1] - 1, parts[0]).toISOString();
        }
      }
      const res = await apiClient.put('/auth/user-info', payload);
      dispatch(setCredentials({ token, user: { ...user, ...res.data.user } }));
      Alert.alert('Success', 'Your information has been updated.');
    } catch(err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Personal Information" right={
        <TouchableOpacity onPress={save} disabled={isLoading}>
          <Text style={{ color: isLoading ? '#9CA3AF' : '#2563EB', fontWeight: '700' }}>{isLoading ? 'Wait' : 'Save'}</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>Full Name</Text>
          <TextInput style={ps.input} value={name} onChangeText={setName} />
        </View>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>Email Address</Text>
          <TextInput style={[ps.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]} value={email} editable={false} />
        </View>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>Phone Number</Text>
          <TextInput style={ps.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[ps.field, { flex: 1 }]}>
            <Text style={ps.fieldLabel}>Age</Text>
            <TextInput style={ps.input} value={age} onChangeText={setAge} keyboardType="numeric" maxLength={3} />
          </View>
          <View style={[ps.field, { flex: 2 }]}>
            <Text style={ps.fieldLabel}>Date of Birth</Text>
            <TextInput style={ps.input} value={dob} onChangeText={handleDobChange} placeholder="DD/MM/YYYY" keyboardType="numeric" maxLength={10} />
          </View>
        </View>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>Occupation</Text>
          <TextInput style={ps.input} value={occupation} onChangeText={setOccupation} />
        </View>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>Hobbies</Text>
          <TextInput style={ps.input} value={hobby} onChangeText={setHobby} />
        </View>
        <View style={ps.field}>
          <Text style={ps.fieldLabel}>About Me</Text>
          <TextInput style={[ps.input, { height: 100, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline numberOfLines={4} />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── 2. Payment Methods ─────────────────────────────────────────────────────
export const PaymentMethodsScreen = () => {
  const insets = useSafeAreaInsets();
  const cards = [
    { last4: '4242', brand: 'Visa',       color: '#1A56DB', icon: 'card' },
    { last4: '5555', brand: 'Mastercard', color: '#D97706', icon: 'card' },
  ];
  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Payment Methods" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={ps.sectionHeader}>Saved Cards</Text>
        {cards.map(c => (
          <View key={c.last4} style={[ps.card, { borderLeftColor: c.color }]}>
            <Icon name={c.icon} size={28} color={c.color} />
            <View style={{ marginLeft: 14 }}>
              <Text style={ps.cardBrand}>{c.brand}</Text>
              <Text style={ps.cardNum}>•••• •••• •••• {c.last4}</Text>
            </View>
            <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => Alert.alert('Remove', 'Card removed.')}>
              <Icon name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={ps.addBtn} onPress={() => Alert.alert('Coming Soon', 'Adding new card coming soon.')}>
          <Icon name="add-circle-outline" size={22} color="#2563EB" />
          <Text style={ps.addBtnText}>Add New Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── 3. Medical Records ──────────────────────────────────────────────────────
export const MedicalRecordsScreen = () => {
  const insets = useSafeAreaInsets();
  const records = [
    { date: 'Mar 15, 2026', type: 'Session Summary',      icon: 'document-text', color: '#8B5CF6' },
    { date: 'Mar 08, 2026', type: 'Mood Assessment',       icon: 'happy',         color: '#F472B6' },
    { date: 'Feb 28, 2026', type: 'Therapist Report',      icon: 'clipboard',     color: '#2563EB' },
    { date: 'Feb 14, 2026', type: 'Wellness Check-in',     icon: 'heart',         color: '#10B981' },
  ];
  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="My Medical Records" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {records.map((r, i) => (
          <TouchableOpacity key={i} style={ps.recordRow} onPress={() => Alert.alert(r.type, 'Detailed view coming soon.')}>
            <View style={[ps.recordIcon, { backgroundColor: r.color + '18' }]}>
              <Icon name={`${r.icon}-outline`} size={22} color={r.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={ps.recordType}>{r.type}</Text>
              <Text style={ps.recordDate}>{r.date}</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
        <View style={ps.emptyNote}>
          <Icon name="information-circle-outline" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
          <Text style={ps.emptyNoteText}>Records are generated automatically after each session.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── 4. Health Reports ───────────────────────────────────────────────────────
export const HealthReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const stats = [
    { label: 'Mood Score (avg)',  value: '7.4 / 10', icon: 'happy-outline',      color: '#F472B6' },
    { label: 'Sessions Completed',value: '12',        icon: 'checkmark-circle-outline', color: '#10B981' },
    { label: 'Day Streak',        value: '7 days',    icon: 'flame-outline',      color: '#F59E0B' },
    { label: 'Sleep Quality',     value: 'Good',      icon: 'moon-outline',       color: '#6366F1' },
    { label: 'Stress Level',      value: 'Moderate',  icon: 'pulse-outline',      color: '#EF4444' },
    { label: 'Mindfulness Mins',  value: '84 min',    icon: 'leaf-outline',       color: '#34D399' },
  ];
  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Health Reports" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={ps.sectionHeader}>This Month's Overview</Text>
        <View style={ps.statsGrid}>
          {stats.map(s => (
            <View key={s.label} style={ps.statCard}>
              <View style={[ps.statIcon, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={ps.statValue}>{s.value}</Text>
              <Text style={ps.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={ps.emptyNote}>
          <Icon name="analytics-outline" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
          <Text style={ps.emptyNoteText}>Detailed charts & trends coming soon.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── 5. Wellness Goals ───────────────────────────────────────────────────────
export const WellnessGoalsScreen = () => {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState([
    { label: 'Meditate daily',        done: true },
    { label: 'Complete 3 sessions/wk', done: false },
    { label: 'Sleep 8 hours',          done: false },
    { label: 'Exercise 30 min/day',    done: true },
  ]);
  const toggle = i => setGoals(g => g.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));

  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Wellness Goals" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {goals.map((g, i) => (
          <TouchableOpacity key={i} style={ps.goalRow} onPress={() => toggle(i)}>
            <View style={[ps.goalCheck, g.done && { backgroundColor: '#10B981', borderColor: '#10B981' }]}>
              {g.done && <Icon name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[ps.goalText, g.done && { textDecorationLine: 'line-through', color: '#9CA3AF' }]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={ps.addBtn} onPress={() => Alert.alert('Coming Soon', 'Adding custom goals coming soon.')}>
          <Icon name="add-circle-outline" size={22} color="#10B981" />
          <Text style={[ps.addBtnText, { color: '#10B981' }]}>Add New Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── 6. Privacy & Security ───────────────────────────────────────────────────
export const PrivacySecurityScreen = () => {
  const insets = useSafeAreaInsets();
  const [biometric, setBiometric] = useState(false);
  const [twoFA,     setTwoFA]     = useState(false);
  const [analytics, setAnalytics] = useState(true);

  const toggleItems = [
    { label: 'Biometric Login',       sub: 'Use fingerprint or Face ID',           value: biometric, setter: setBiometric, color: '#2563EB' },
    { label: 'Two-Factor Auth',        sub: 'Extra security via SMS code',          value: twoFA,     setter: setTwoFA,     color: '#8B5CF6' },
    { label: 'Share Analytics',        sub: 'Help improve the app anonymously',     value: analytics, setter: setAnalytics, color: '#10B981' },
  ];

  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Privacy & Security" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={ps.sectionHeader}>Security Settings</Text>
        {toggleItems.map(t => (
          <View key={t.label} style={ps.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={ps.toggleLabel}>{t.label}</Text>
              <Text style={ps.toggleSub}>{t.sub}</Text>
            </View>
            <Switch
              value={t.value}
              onValueChange={t.setter}
              trackColor={{ false: '#E5E7EB', true: t.color + '66' }}
              thumbColor={t.value ? t.color : '#9CA3AF'}
            />
          </View>
        ))}
        <Text style={ps.sectionHeader}>Data</Text>
        {[
          { label: 'Download my data', icon: 'download-outline', color: '#2563EB' },
          { label: 'Delete my account', icon: 'trash-outline', color: '#EF4444' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={ps.actionRow}
            onPress={() => Alert.alert(a.label, `${a.label} coming soon.`)}>
            <Icon name={a.icon} size={20} color={a.color} style={{ marginRight: 12 }} />
            <Text style={[ps.actionLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── 7. Help & Support ───────────────────────────────────────────────────────
export const HelpSupportScreen = () => {
  const insets = useSafeAreaInsets();
  const faqs = [
    { q: 'How do I book a session?',      a: 'Go to the Sessions tab and tap "Find a Therapist" to browse and book.' },
    { q: 'Can I cancel a session?',        a: 'Yes. Go to My Appointments and tap "Cancel" up to 24 hours before the session.' },
    { q: 'Is my data private?',            a: 'All conversations and data are encrypted and never shared with third parties.' },
    { q: 'How does the AI companion work?',a: 'The AI uses advanced language models fine-tuned for mental wellness support.' },
  ];
  const [open, setOpen] = useState(null);

  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="Help & Support" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={ps.sectionHeader}>FAQs</Text>
        {faqs.map((f, i) => (
          <TouchableOpacity key={i} style={ps.faqCard} onPress={() => setOpen(open === i ? null : i)}>
            <View style={ps.faqQ}>
              <Text style={ps.faqQText}>{f.q}</Text>
              <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
            </View>
            {open === i && <Text style={ps.faqA}>{f.a}</Text>}
          </TouchableOpacity>
        ))}
        <Text style={ps.sectionHeader}>Contact Us</Text>
        {[
          { label: 'Email Support', icon: 'mail-outline', color: '#2563EB', action: 'support@trident.app' },
          { label: 'Live Chat',     icon: 'chatbubble-outline', color: '#10B981', action: 'Chat' },
          { label: 'Call Us',       icon: 'call-outline', color: '#F59E0B', action: '+91 800-123-4567' },
        ].map(c => (
          <TouchableOpacity key={c.label} style={ps.contactRow}
            onPress={() => Alert.alert(c.label, c.action)}>
            <View style={[ps.contactIcon, { backgroundColor: c.color + '15' }]}>
              <Icon name={c.icon} size={20} color={c.color} />
            </View>
            <Text style={ps.contactLabel}>{c.label}</Text>
            <Icon name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── 8. About ────────────────────────────────────────────────────────────────
export const AboutScreen = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={ps.root}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />
      <SubHeader title="About" />
      <ScrollView contentContainerStyle={[ps.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={ps.aboutHero}>
          <View style={ps.aboutLogo}>
            <Icon name="heart" size={40} color="#2563EB" />
          </View>
          <Text style={ps.appName}>Trident</Text>
          <Text style={ps.appVersion}>Version 1.0.0 (Build 84)</Text>
        </View>
        {[
          { label: 'App Version',     value: '1.0.0' },
          { label: 'Build Number',    value: '84' },
          { label: 'Platform',        value: 'React Native' },
          { label: 'Release Date',    value: 'March 2026' },
        ].map(r => (
          <View key={r.label} style={ps.aboutRow}>
            <Text style={ps.aboutLabel}>{r.label}</Text>
            <Text style={ps.aboutValue}>{r.value}</Text>
          </View>
        ))}
        <Text style={ps.sectionHeader}>Legal</Text>
        {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(l => (
          <TouchableOpacity key={l} style={ps.legalRow}
            onPress={() => Alert.alert(l, `${l} document coming soon.`)}>
            <Text style={ps.legalLabel}>{l}</Text>
            <Icon name="open-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
        <Text style={ps.copyright}>© 2026 Trident Health. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
};

// ─── Shared Styles ───────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F9FAFB' },
  scroll:{ padding: 16 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 10 },

  // Fields (Personal Info)
  field:       { marginBottom: 16 },
  fieldLabel:  { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  input:       { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },

  // Cards
  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  cardBrand:   { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardNum:     { fontSize: 14, color: '#6B7280', marginTop: 2 },

  // Add button
  addBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed', padding: 14, marginTop: 8 },
  addBtnText:  { fontSize: 15, fontWeight: '600', color: '#2563EB', marginLeft: 8 },

  // Records
  recordRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  recordIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recordType:  { fontSize: 15, fontWeight: '600', color: '#111827' },
  recordDate:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Stats grid (Health Reports)
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:    { width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center' },
  statIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue:   { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLbl:     { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  // Goals
  goalRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10 },
  goalCheck:   { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  goalText:    { fontSize: 15, color: '#111827', flex: 1 },

  // Toggle rows (Privacy)
  toggleRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10 },
  toggleLabel: { fontSize: 15, color: '#111827', fontWeight: '600' },
  toggleSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  actionRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10 },
  actionLabel: { fontSize: 15, fontWeight: '600' },

  // FAQs
  faqCard:     { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10 },
  faqQ:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQText:    { fontSize: 15, color: '#111827', fontWeight: '600', flex: 1, marginRight: 8 },
  faqA:        { fontSize: 14, color: '#6B7280', lineHeight: 20, marginTop: 10 },

  // Contact
  contactRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10 },
  contactIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  contactLabel:{ flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },

  // About
  aboutHero:   { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  aboutLogo:   { width: 80, height: 80, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName:     { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  appVersion:  { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  aboutRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  aboutLabel:  { fontSize: 14, color: '#6B7280' },
  aboutValue:  { fontSize: 14, color: '#111827', fontWeight: '600' },
  legalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  legalLabel:  { fontSize: 14, color: '#2563EB' },
  copyright:   { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 20 },

  // Shared
  emptyNote:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginTop: 8 },
  emptyNoteText: { fontSize: 13, color: '#9CA3AF', flex: 1, lineHeight: 18 },
});
