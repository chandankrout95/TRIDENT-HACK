import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { SleepPredictorSkeleton } from '../../shared/components/Skeleton'; // Reusing for similar layout

const MoodStressPredictorScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyzeStress();
  }, []);

  const analyzeStress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        screen_time_hours: 7.5,
        social_media_platforms_used: 3,
        hours_on_Instagram: 2,
        sleep_hours: 6.5
      };

      const res = await fetch('https://2ktl27x7-8000.inc1.devtunnels.ms/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.predicted_stress_category) {
        setResult(data);
      } else {
        setError("Invalid response from prediction server.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to analyze stress data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const isHighStress = result?.predicted_stress_category?.toLowerCase().includes('high');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Stress & Mood Analyzer</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SleepPredictorSkeleton />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={60} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={analyzeStress}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : result && (
          <View style={styles.resultContainer}>

            <LinearGradient
              colors={isHighStress ? ['#F59E0B', '#D97706'] : ['#10B981', '#059669']}
              style={styles.statusCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Icon name={isHighStress ? "warning" : "happy"} size={48} color="#FFF" style={styles.statusIcon} />
              <Text style={styles.statusTitle}>{result.predicted_stress_category} Stress Detected</Text>

              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Predicted Mood Score: {result.predicted_mood_score}</Text>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="bulb" size={22} color="#EC4899" />
                <Text style={styles.sectionTitle}>AI Personalized Recommendation</Text>
              </View>
              <View style={styles.adviceContainer}>
                <View style={styles.adviceRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.adviceText}>{result.recommendation}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="server" size={22} color="#4B5563" />
                <Text style={styles.sectionTitle}>Analyzed Metrics</Text>
              </View>
              <View style={styles.dataCard}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Screen Time Evaluated</Text>
                  <Text style={styles.dataValue}>7.5 hours</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Primary Factor</Text>
                  <Text style={styles.dataValue}>Social Media Usage</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity> 
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  errorText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginVertical: 20, paddingHorizontal: 20 },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  resultContainer: { flex: 1 },
  statusCard: { borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4, marginBottom: 25 },
  statusIcon: { marginBottom: 15 },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  scoreBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scoreText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },

  adviceContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  bulletPoint: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC4899', marginTop: 6, marginRight: 12 },
  adviceText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },

  dataCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  dataLabel: { fontSize: 15, color: '#6B7280' },
  dataValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },

  doneBtn: { backgroundColor: '#EC4899', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default MoodStressPredictorScreen;
