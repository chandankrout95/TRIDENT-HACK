import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import { SearchSkeleton } from '../../shared/components/Skeleton';

const SearchResultScreen = ({ route }) => {
  const navigation = useNavigation();
  const initialQuery = route?.params?.initialQuery || '';
  const [query] = useState(initialQuery);
  const [allTherapists, setAllTherapists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      {/* Header — read-only search bar, tap to go back to suggestions */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBox} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Icon name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
          <Text style={styles.queryText} numberOfLines={1}>{query || 'Search therapists...'}</Text>
          <Icon name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {!isLoading && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {filtered.length} therapist{filtered.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <SearchSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderTherapist}
          contentContainerStyle={{ padding: 15 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No therapists found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
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
  queryText: { flex: 1, fontSize: 16, color: '#111827' },
  countBar: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F3F4F6' },
  countText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
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
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginTop: 15 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
});

export default SearchResultScreen;
