import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import useWatchSync from '../../hooks/useWatchSync';
import LinearGradient from 'react-native-linear-gradient';
import { SleepPredictorSkeleton } from '../../shared/components/Skeleton';

const SleepPredictorScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const { vitals } = useWatchSync();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyzeSleep();
  }, []);

  const analyzeSleep = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        Gender: user?.gender || "Male",
        Age: user?.age || 34,
        Occupation: user?.occupation || "Software Engineer",
        Sleep_Duration: vitals?.sleep ? parseFloat(vitals.sleep.split('h')[0]) : 5.8,
        Quality_of_Sleep: 4,
        Physical_Activity_Level: vitals?.steps ? Math.min(Math.round(vitals.steps / 100), 100) : 30,
        Stress_Level: 8,
        BMI_Category: "Overweight",
        Blood_Pressure_Systolic: 138,
        Heart_Rate: vitals?.heartRate || 78,
        Daily_Steps: vitals?.steps || 3500
      };

      const res = await fetch('https://sleep-disease-predictor.vercel.app/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        setResult(data);
      } else {
        setError("Invalid response from prediction server.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to analyze sleep data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPredictionMessage = (prediction) => {
    if (!prediction || prediction === '[nan]') {
      return "You have a good sleep cycle. Keep it up!";
    }
    return `Potential Risk: ${prediction.replace(/[[\]]/g, '')}`;
  };

  const isGoodSleep = !result?.prediction || result?.prediction === '[nan]';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Sleep Predictor</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SleepPredictorSkeleton />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={60} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={analyzeSleep}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : result && (
          <View style={styles.resultContainer}>

            <LinearGradient
              colors={isGoodSleep ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
              style={styles.statusCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Icon name={isGoodSleep ? "checkmark-circle" : "warning"} size={48} color="#FFF" style={styles.statusIcon} />
              <Text style={styles.statusTitle}>{getPredictionMessage(result.prediction)}</Text>

              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Quality Score: {result.sleep_quality_score}</Text>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="bulb" size={22} color="#7C3AED" />
                <Text style={styles.sectionTitle}>AI Personalized Advice</Text>
              </View>
              <View style={styles.adviceContainer}>
                {result.llm_personalized_advice?.map((advice, index) => (
                  <View key={index} style={styles.adviceRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.adviceText}>{advice}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="server" size={22} color="#4B5563" />
                <Text style={styles.sectionTitle}>Analysis Metadata</Text>
              </View>
              <View style={styles.dataCard}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Estimated BP</Text>
                  <Text style={styles.dataValue}>{result.metadata?.calculated_bp || 'N/A'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Sleep Quality Rating</Text>
                  <Text style={styles.dataValue}>{result.metadata?.input_quality_rating || 'N/A'}</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  loaderCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F0FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loadingTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  loadingSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 },

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
  bulletPoint: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED', marginTop: 6, marginRight: 12 },
  adviceText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },

  dataCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  dataLabel: { fontSize: 15, color: '#6B7280' },
  dataValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', my: 8 },

  doneBtn: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default SleepPredictorScreen;
