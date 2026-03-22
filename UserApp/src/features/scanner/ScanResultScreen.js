import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ScanResultScreen = ({ route }) => {
  const navigation = useNavigation();
  const { success, analysis } = route.params || { success: false, analysis: null };

  if (!success) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.errorCircle}>
          <Icon name="warning" size={50} color="#DC2626" />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ alignItems: 'center' }}>
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorText}>We couldn't detect clear vital signs. Please make sure you are in a well-lit environment and hold your phone steady.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('ScannerScreen')}>
            <Icon name="refresh" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Use AI Extracted Data
  const results = [
    { label: 'Condition / Disease', value: analysis?.disease || 'Unknown', icon: 'pulse', color: '#EF4444', bg: '#FEE2E2' },
    { label: 'Medicines', value: analysis?.medicine || 'Unknown', icon: 'medkit', color: '#2563EB', bg: '#DBEAFE' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.popToTop()}>
          <Icon name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Identified</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.successBanner}>
          <View style={styles.successIconBox}>
            <Icon name="checkmark-done-circle" size={40} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>Medicine Recognized</Text>
          <Text style={styles.successSub}>AI cross-referenced with your health profile.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Identification Details</Text>

          {results.map((r, i) => (
            <View key={i} style={styles.resultCard}>
              <View style={[styles.resultIcon, { backgroundColor: r.bg }]}>
                <Icon name={r.icon} size={24} color={r.color} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultLabel}>{r.label}</Text>
                <Text style={styles.resultValue}>{r.value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.aiInsightCard}>
          <View style={styles.aiHeader}>
            <Icon name="sparkles" size={20} color="#F59E0B" />
            <Text style={styles.aiTitle}>Sia's Assistant Guide</Text>
          </View>
          <Text style={styles.aiText}>{analysis?.instructions || 'No instructions provided.'}</Text>
        </Animated.View>

        {analysis?.buy_link && (
          <TouchableOpacity style={styles.buyBtn} onPress={() => Linking.openURL(analysis.buy_link)}>
            <Icon name="cart" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.buyBtnText}>Buy {analysis.medicine?.split(',')[0]} Online</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.saveBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerAll: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  // Error Styles
  errorCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  errorText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20, lineHeight: 22 },
  retryBtn: { flexDirection: 'row', backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 14, alignItems: 'center', marginBottom: 15 },
  retryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 10 },
  cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },

  // Success Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  successBanner: { alignItems: 'center', backgroundColor: '#FFF', padding: 30, borderRadius: 24, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  resultsContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  resultCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  resultInfo: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16 },
  resultLabel: { fontSize: 13, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

  aiInsightCard: { backgroundColor: '#FFFBEB', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7', marginBottom: 20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#D97706', marginLeft: 8 },
  aiText: { fontSize: 15, color: '#92400E', lineHeight: 24 },

  buyBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 3, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8 },
  buyBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  saveBtn: { backgroundColor: '#E5E7EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#374151', fontSize: 18, fontWeight: 'bold' }
});

export default ScanResultScreen;
