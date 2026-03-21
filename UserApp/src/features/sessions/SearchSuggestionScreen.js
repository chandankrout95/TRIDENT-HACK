import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SkeletonBox } from '../../shared/components/Skeleton';

const SearchSuggestionScreen = () => {
  const navigation = useNavigation();
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const recentSearches = ['Anxiety', 'Depression', 'Family Therapy', 'PTSD', 'Addiction'];
  const popularSpecs = ['CBT', 'Couples Counseling', 'Child Psychology', 'Mindfulness', 'Grief Counseling'];
  const topCategories = [
    { icon: 'heart', label: 'Relationship', color: '#FFF', bg: '#E11D48' },
    { icon: 'happy', label: 'Anxiety', color: '#FFF', bg: '#7C3AED' },
    { icon: 'sad', label: 'Depression', color: '#FFF', bg: '#2563EB' },
    { icon: 'people', label: 'Family', color: '#FFF', bg: '#059669' },
    { icon: 'fitness', label: 'Stress', color: '#FFF', bg: '#D97706' },
    { icon: 'medical', label: 'Trauma', color: '#FFF', bg: '#0891B2' },
  ];

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // Always focus input when this screen gets focus (from Sessions or back from Results)
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }, [isLoading])
  );

  const goSearch = (prefill = '') => {
    navigation.navigate('SearchResultScreen', { initialQuery: prefill });
  };

  const handleSubmit = () => {
    if (query.trim()) {
      goSearch(query.trim());
    }
  };

  // ─── Skeleton ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 16, color: '#9CA3AF' }}>Search therapists...</Text>
          </View>
        </View>
        <View style={{ padding: 20 }}>
          <SkeletonBox width={120} height={12} radius={6} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
            {[80, 100, 110, 70, 90].map((w, i) => (
              <SkeletonBox key={i} width={w} height={36} radius={18} />
            ))}
          </View>
          <SkeletonBox width={160} height={12} radius={6} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
            {[65, 140, 120, 100, 130].map((w, i) => (
              <SkeletonBox key={i} width={w} height={36} radius={18} />
            ))}
          </View>
          <SkeletonBox width={130} height={12} radius={6} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={{ width: '47%', marginBottom: 10 }}>
                <SkeletonBox width="100%" height={72} radius={16} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ─── Content ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header with REAL text input — auto-focused */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TouchableOpacity onPress={handleSubmit}>
            <Icon name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search therapists, specialization..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent Searches</Text>
          <View style={styles.chipRow}>
            {recentSearches.map((s, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => goSearch(s)}>
                <Icon name="time-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Popular Specializations</Text>
          <View style={styles.chipRow}>
            {popularSpecs.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.chip, styles.specChip]} onPress={() => goSearch(s)}>
                <Icon name="medical" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, { color: '#2563EB' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Categories grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Top Categories</Text>
          <View style={styles.catGrid}>
            {topCategories.map((cat, i) => (
              <TouchableOpacity key={i} style={[styles.catCard, { backgroundColor: cat.bg }]} onPress={() => goSearch(cat.label)}>
                <Icon name={cat.icon} size={24} color={cat.color} />
                <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { marginRight: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 48 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  specChip: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipText: { fontSize: 14, color: '#374151' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '47%', paddingVertical: 20, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  catLabel: { fontSize: 15, fontWeight: '600' },
});

export default SearchSuggestionScreen;
