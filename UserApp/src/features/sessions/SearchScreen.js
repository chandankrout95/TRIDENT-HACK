import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { SearchSkeleton } from '../../shared/components/Skeleton';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [allTherapists, setAllTherapists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const recentSearches = ['Anxiety', 'Depression', 'Family Therapy', 'PTSD', 'Addiction'];
  const popularSpecs = ['CBT', 'Couples Counseling', 'Child Psychology', 'Mindfulness', 'Grief Counseling'];

  useEffect(() => {
    apiClient.get('/user/therapists')
      .then(res => { setAllTherapists(res.data); setFiltered(res.data); })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(allTherapists);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(allTherapists.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.specialization || '').toLowerCase().includes(q) ||
      (t.bio || '').toLowerCase().includes(q)
    ));
  }, [query, allTherapists]);

  const renderStar = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
      );
    }
    return stars;
  };

  const renderTherapist = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('TherapistProfileScreen', { therapist: item })}
    >
      <View style={styles.resultAvatar}>
        <Icon name="person-circle" size={50} color="#2563EB" />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultSpec}>{item.specialization || 'General'}</Text>
        <View style={styles.resultMeta}>
          <View style={styles.starsRow}>{renderStar(item.rating || 4.5)}</View>
          <Text style={styles.resultReviews}>({item.reviewCount || 0})</Text>
          <Text style={styles.resultRate}>${item.hourlyRate || 80}/hr</Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search therapists, specialization..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <SearchSkeleton />
      ) : query.length === 0 ? (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <View style={{ padding: 20 }}>
              <Text style={styles.sectionLabel}>Recent Searches</Text>
              <View style={styles.chipRow}>
                {recentSearches.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.chip} onPress={() => setQuery(s)}>
                    <Icon name="time-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.sectionLabel, { marginTop: 25 }]}>Popular Specializations</Text>
              <View style={styles.chipRow}>
                {popularSpecs.map((s, i) => (
                  <TouchableOpacity key={i} style={[styles.chip, styles.specChip]} onPress={() => setQuery(s)}>
                    <Icon name="medical" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, { color: '#2563EB' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          renderItem={() => null}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderTherapist}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>No therapists found for "{query}"</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  backBtn: { marginRight: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 48 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  specChip: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipText: { fontSize: 14, color: '#374151' },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  resultAvatar: { marginRight: 14 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  resultSpec: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  starsRow: { flexDirection: 'row', marginRight: 5 },
  resultReviews: { fontSize: 12, color: '#9CA3AF', marginRight: 10 },
  resultRate: { fontSize: 13, fontWeight: 'bold', color: '#059669' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 15 }
});

export default SearchScreen;
