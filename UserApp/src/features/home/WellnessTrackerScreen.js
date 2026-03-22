import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import useWatchSync from '../../hooks/useWatchSync';
import { WellnessTrackerSkeleton } from '../../shared/components/Skeleton';
import apiClient from '../../services/apiClient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

const WellnessTrackerScreen = () => {
  const navigation = useNavigation();
  const { vitals } = useWatchSync();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/goals');
      setGoals(data);
    } catch (error) {
      console.error('Fetch goals failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoalText.trim()) return;
    try {
      setIsAdding(true);
      const { data } = await apiClient.post('/goals', { text: newGoalText });
      setGoals([...goals, data]);
      setNewGoalText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleGoal = async (id) => {
    try {
      const { data } = await apiClient.patch(`/goals/${id}/toggle`);
      setGoals(goals.map(g => g._id === id ? data : g));
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await apiClient.delete(`/goals/${id}`);
      setGoals(goals.filter(g => g._id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete goal');
    }
  };

  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [40, 65, 30, 85, 70, 95, 55] }]
  };

  const healthHeaderStats = [
    { icon: 'footsteps', color: '#64FFDA', label: 'Steps', value: vitals.steps.toLocaleString(), unit: '', bg: '#64FFDA15' },
    { icon: 'heart', color: '#FF6B6B', label: 'Heart Rate', value: vitals.heartRate, unit: 'bpm', bg: '#FF6B6B15' },
    { icon: 'flame', color: '#F59E0B', label: 'Calories', value: vitals.calories, unit: 'kcal', bg: '#F59E0B15' },
    { icon: 'moon', color: '#A78BFA', label: 'Sleep', value: vitals.sleep, unit: '', bg: '#A78BFA15' },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness Tracker</Text>
          <View style={{ width: 40 }} />
        </View>
        <WellnessTrackerSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Tracker</Text>
        <TouchableOpacity onPress={fetchGoals}>
          <Icon name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vitals Grid */}
        <View style={styles.vitalsGrid}>
          {healthHeaderStats.map((stat, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 100)} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: stat.bg }]}>
                <Icon name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value} <Text style={styles.statUnit}>{stat.unit}</Text></Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Daily Goals Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            <View style={styles.goalCountBadge}>
              <Text style={styles.goalCountText}>{goals.filter(g => g.completed).length}/{goals.length}</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a new goal..."
              value={newGoalText}
              onChangeText={setNewGoalText}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity 
              style={[styles.addBtn, !newGoalText.trim() && styles.addBtnDisabled]} 
              onPress={addGoal}
              disabled={!newGoalText.trim() || isAdding}
            >
              <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="list-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No goals set for today. Add one above!</Text>
            </View>
          ) : (
            goals.map((goal, index) => (
              <Animated.View key={goal._id} entering={FadeInDown.delay(index * 50)} style={styles.goalItem}>
                <TouchableOpacity 
                  style={styles.goalCheck} 
                  onPress={() => toggleGoal(goal._id)}
                >
                  <Icon 
                    name={goal.completed ? "checkmark-circle" : "ellipse-outline"} 
                    size={26} 
                    color={goal.completed ? "#10B981" : "#D1D5DB"} 
                  />
                </TouchableOpacity>
                <Text style={[styles.goalText, goal.completed && styles.goalTextDone]}>
                  {goal.text}
                </Text>
                <TouchableOpacity onPress={() => deleteGoal(goal._id)}>
                  <Icon name="trash-outline" size={20} color="#EF4444" style={{ opacity: 0.6 }} />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>

        {/* Activity Chart */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Engagement Activity</Text>
          <Text style={styles.chartSub}>Activity score based on your interaction patterns</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={activityData}
              width={SCREEN_W - 70}
              height={200}
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#4F46E5' },
                propsForBackgroundLines: { stroke: '#F3F4F6' }
              }}
              bezier
              style={{ paddingRight: 0, marginTop: 15 }}
              withVerticalLines={false}
              withInnerLines={true}
            />
          </View>
        </View>
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
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25, justifyContent: 'space-between' },
  statCard: { width: (SCREEN_W - 40 - 12) / 2, backgroundColor: '#FFF', borderRadius: 24, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 5 },
  statUnit: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },

  sectionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  goalCountBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goalCountText: { color: '#4F46E5', fontSize: 12, fontWeight: 'bold' },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 15, height: 50, color: '#111827', fontSize: 15 },
  addBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.5 },

  goalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  goalCheck: { marginRight: 15 },
  goalText: { flex: 1, fontSize: 15, color: '#374151' },
  goalTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },

  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 10, textAlign: 'center' },

  chartSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  chartContainer: { alignItems: 'center', marginLeft: -20 }
});

export default WellnessTrackerScreen;
