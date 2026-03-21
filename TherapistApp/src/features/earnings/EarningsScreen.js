import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Skeleton from '../../components/common/Skeleton';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const EarningsScreen = () => {
  const navigation = useNavigation();
  const [balance, setBalance] = useState(2450.50);
  const [isLoading, setIsLoading] = useState(true);
  
  const transactions = [
    { id: '1', type: 'Session', client: 'Alice Johnson', date: 'Oct 20, 2023', amount: 80.00, status: 'completed' },
    { id: '2', type: 'Withdrawal', method: 'Bank Transfer', date: 'Oct 18, 2023', amount: -500.00, status: 'pending' },
    { id: '3', type: 'Session', client: 'Bob Smith', date: 'Oct 17, 2023', amount: 80.00, status: 'completed' },
    { id: '4', type: 'Session', client: 'Charlie Brown', date: 'Oct 15, 2023', amount: 120.00, status: 'completed' },
    { id: '5', type: 'Withdrawal', method: 'PayPal', date: 'Oct 12, 2023', amount: -200.00, status: 'completed' },
  ];

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
        setIsLoading(false);
    }, 1500);
  }, []);

  const renderTransaction = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(300 + index * 100)}
      style={styles.transactionItem}
    >
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? '#D1FAE5' : '#FEE2E2' }]}>
          <Icon 
            name={item.amount > 0 ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={item.amount > 0 ? '#10B981' : '#EF4444'} 
          />
        </View>
        <View>
          <Text style={styles.transactionTitle}>{item.type === 'Session' ? `Session: ${item.client}` : `Withdrawal: ${item.method}`}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#10B981' : '#111827' }]}>
          {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text style={[styles.transactionStatus, { color: item.status === 'pending' ? '#F59E0B' : '#9CA3AF' }]}>
          {item.status}
        </Text>
      </View>
    </Animated.View>
  );

  const renderSkeletonRow = () => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Skeleton width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
        <View>
          <Skeleton width={150} height={16} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Skeleton width={60} height={18} />
        <Skeleton width={50} height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="filter-variant" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.balanceCardContainer}>
          <LinearGradient
            colors={['#111827', '#374151']}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            {isLoading ? (
                <Skeleton width={150} height={36} style={{ marginVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            ) : (
                <Text style={styles.balanceValue}>${balance.toLocaleString()}</Text>
            )}
            
            <View style={styles.balanceFooter}>
              <View>
                <Text style={styles.footerLabel}>This Month</Text>
                {isLoading ? (
                    <Skeleton width={100} height={18} style={{ marginTop: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                    <Text style={styles.footerValue}>+$1,240.00</Text>
                )}
              </View>
              <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate('Withdraw')}>
                <Text style={styles.withdrawText}>Withdraw</Text>
                <Icon name="chevron-right" size={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <View style={styles.quickStats}>
            <View style={styles.qStat}>
                <Text style={styles.qStatLabel}>Pending</Text>
                {isLoading ? <Skeleton width={60} height={18} /> : <Text style={styles.qStatValue}>$320.00</Text>}
            </View>
            <View style={styles.qStat}>
                <Text style={styles.qStatLabel}>Withdrawn</Text>
                {isLoading ? <Skeleton width={60} height={18} /> : <Text style={styles.qStatValue}>$4,800.00</Text>}
            </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View>
                {[1, 2, 3, 4, 5].map((_, i) => (
                    <View key={i}>{renderSkeletonRow()}</View>
                ))}
            </View>
          ) : (
            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  balanceCardContainer: { marginVertical: 10 },
  balanceCard: { borderRadius: 32, padding: 32 },
  balanceLabel: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  footerLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  footerValue: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  withdrawText: { color: '#111827', fontWeight: '700', marginRight: 4 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
  qStat: { flex: 1, backgroundColor: '#FAFAFA', padding: 20, borderRadius: 24, marginRight: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  qStatLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  qStatValue: { color: '#111827', fontSize: 18, fontWeight: '800' },
  transactionsSection: { marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAllText: { fontSize: 14, color: '#10B981', fontWeight: '700' },
  listContainer: { paddingBottom: 20 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  transactionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  transactionDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '800' },
  transactionStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }
});

export default EarningsScreen;
