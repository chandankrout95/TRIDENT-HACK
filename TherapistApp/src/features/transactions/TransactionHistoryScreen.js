import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../../services/apiClient';
import Skeleton from '../../components/common/Skeleton';

const TransactionHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const fetchTransactions = async (pageNum) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      const { data } = await apiClient.get(`/transactions/my?page=${pageNum}&limit=15`);
      
      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      setTotalPages(data.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMore = () => {
    if (!isFetchingMore && page < totalPages) {
      fetchTransactions(page + 1);
    }
  };

  const renderItem = ({ item, index }) => {
    const isEarning = item.type === 'earning';
    
    return (
      <Animated.View entering={FadeInDown.delay(index % 10 * 50)}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: isEarning ? '#D1FAE5' : '#FEE2E2' }]}>
            <Icon name={isEarning ? 'arrow-down' : 'arrow-up'} size={24} color={isEarning ? '#10B981' : '#EF4444'} />
          </View>
          <View style={styles.details}>
            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: isEarning ? '#10B981' : '#111827' }]}>
              {isEarning ? '+' : '-'}₹{item.amount}
            </Text>
            <Text style={[styles.status, { color: item.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.list}>
      {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={160} height={16} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={12} />
          </View>
          <Skeleton width={60} height={18} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        renderSkeleton()
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Icon name="receipt" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySub}>Your earnings and withdrawals will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} /> : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16,
    borderRadius: 20, marginBottom: 16, elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  details: { flex: 1 },
  description: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  date: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  amountContainer: { alignItems: 'flex-end', paddingLeft: 10 },
  amount: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  status: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#374151', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 }
});

export default TransactionHistoryScreen;
