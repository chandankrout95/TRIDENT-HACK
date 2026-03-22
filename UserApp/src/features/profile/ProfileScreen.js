import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideInRight, ZoomIn, BounceIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCredentials } from '../../store/authSlice';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    dispatch(setCredentials({ token: null, user: null }));
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Personal Information', screen: 'PersonalInfoScreen', color: '#2563EB' },
        { icon: 'notifications-outline', title: 'Notifications', screen: 'NotificationsScreen', color: '#F59E0B' },
        { icon: 'card-outline', title: 'Payment Methods', screen: 'PaymentMethodsScreen', color: '#10B981' },
      ]
    },
    {
      title: 'Health',
      items: [
        { icon: 'document-text-outline', title: 'My Medical Records', screen: 'MedicalRecordsScreen', color: '#8B5CF6' },
        { icon: 'analytics-outline', title: 'Health Reports', screen: 'HealthReportsScreen', color: '#EC4899' },
        { icon: 'fitness-outline', title: 'Wellness Goals', screen: 'WellnessGoalsScreen', color: '#0EA5E9' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'lock-closed-outline', title: 'Privacy & Security', screen: 'PrivacySecurityScreen', color: '#374151' },
        { icon: 'help-circle-outline', title: 'Help & Support', screen: 'HelpSupportScreen', color: '#6366F1' },
        { icon: 'information-circle-outline', title: 'About', screen: 'AboutScreen', color: '#9CA3AF' },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <Animated.View entering={ZoomIn.delay(150).duration(500)} style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Icon name="person" size={50} color="#2563EB" />
            </View>
          </View>
          <Animated.Text entering={FadeInUp.delay(250).duration(400)} style={styles.name}>
            {user?.name || user?.email?.split('@')[0] || 'User Name'}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(350).duration(400)} style={styles.email}>
            {user?.email || 'user@example.com'}
          </Animated.Text>

          {/* Member Badge */}
          <Animated.View entering={BounceIn.delay(450)} style={styles.memberBadge}>
            <Icon name="diamond" size={14} color="#F59E0B" />
            <Text style={styles.memberText}>Premium Member</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="calendar" size={18} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="flame" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="star" size={18} color="#10B981" />
              </View>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={SlideInLeft.delay(300).duration(400)} style={styles.quickActionsRow}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#DBEAFE' }]} onPress={() => navigation.navigate('Sessions')}>
            <Icon name="calendar-outline" size={22} color="#2563EB" />
            <Text style={[styles.quickActionText, { color: '#2563EB' }]}>My Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#DCFCE7' }]} onPress={() => navigation.navigate('SearchScreen')}>
            <Icon name="search-outline" size={22} color="#10B981" />
            <Text style={[styles.quickActionText, { color: '#10B981' }]}>Find Doctor</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <Animated.View key={sIdx} entering={SlideInRight.delay(400 + sIdx * 100).duration(400)}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[styles.menuItem, iIdx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Icon name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(700).duration(400)}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Icon name="log-out-outline" size={22} color="#DC2626" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.0 • Made with ❤️</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderColor: '#E5E7EB'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

  profileCard: {
    margin: 20, padding: 28, backgroundColor: '#FFF', borderRadius: 28,
    alignItems: 'center', elevation: 4,
    shadowColor: '#2563EB', shadowOpacity: 0.08, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52,
    padding: 3, marginBottom: 16,
    borderWidth: 3, borderColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center',
  },
  name: { fontSize: 24, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  memberBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: '#FDE68A'
  },
  memberText: { fontSize: 12, fontWeight: '700', color: '#B45309', marginLeft: 6 },

  statsRow: {
    flexDirection: 'row', marginTop: 24, paddingTop: 24,
    borderTopWidth: 1, borderColor: '#F3F4F6', width: '100%', justifyContent: 'space-around'
  },
  statItem: { alignItems: 'center' },
  statIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },

  quickActionsRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8
  },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8
  },
  quickActionText: { fontSize: 14, fontWeight: '700' },

  sectionTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#6B7280',
    textTransform: 'uppercase', marginLeft: 20, marginTop: 20, marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  menuIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTitle: { fontSize: 16, color: '#111827', fontWeight: '600', flex: 1 },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 30, marginHorizontal: 20, padding: 18,
    backgroundColor: '#FEF2F2', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#FCA5A5'
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },

  versionContainer: { alignItems: 'center', marginTop: 20, paddingBottom: 20 },
  versionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});

export default ProfileScreen;
