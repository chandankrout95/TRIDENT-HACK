import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import Animated, { SlideInRight, SlideInDown, BounceIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const personas = [
  { id: '7', name: 'Personal AI Therapist', icon: 'medkit', color: '#0EA5E9', desc: 'Professional, objective psychological guidance.' },
  { id: '1', name: 'Girlfriend', icon: 'heart', color: '#EC4899', desc: 'A caring and affectionate companion.' },
  { id: '2', name: 'Bestfriend', icon: 'happy', color: '#F59E0B', desc: 'Your funny, loyal partner in crime.' },
  { id: '3', name: 'Mother', icon: 'rose', color: '#8B5CF6', desc: 'Warm, nurturing, and deeply supportive.' },
  { id: '4', name: 'Father', icon: 'shield-checkmark', color: '#3B82F6', desc: 'Wise, protective, and grounding advice.' },
  { id: '5', name: 'Brother', icon: 'game-controller', color: '#10B981', desc: 'Fun, teasing, but always has your back.' },
  { id: '6', name: 'Sister', icon: 'flower', color: '#F43F5E', desc: 'Empathetic, chatty, and totally understands.' },
];

const PersonaSelectionScreen = () => {
  const navigation = useNavigation();

  const handleSelectPersona = (persona) => {
    navigation.navigate('AIChatScreen', { persona: persona.name, personaColor: persona.color, personaIcon: persona.icon });
  };

  const renderPersona = ({ item, index }) => (
    <View>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
        onPress={() => handleSelectPersona(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} size={30} color={item.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.desc}>{item.desc}</Text>
        </View>
        <Icon name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={SlideInDown.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>Who would you like to speak with?</Text>
        <Text style={styles.headerSub}>Select an AI persona to begin your conversation.</Text>
      </Animated.View>
      <FlatList
        data={personas}
        keyExtractor={item => item.id}
        renderItem={renderPersona}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  headerSub: { fontSize: 14, color: '#6B7280' },
  list: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, marginBottom: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18 }
});

export default PersonaSelectionScreen;
