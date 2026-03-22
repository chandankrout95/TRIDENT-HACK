import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Skeleton from '../../components/common/Skeleton';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../services/apiClient';

const { width } = Dimensions.get('window');

const formatINR = (amount) => {
  const num = Math.abs(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (day.getTime() === today.getTime()) return `Today, ${time}`;
  if (day.getTime() === yesterday.getTime()) return `Yesterday, ${time}`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`;
};

const EarningsScreen = () => {
  const navigation = useNavigation();
  const [earnings, setEarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      apiClient.get('/transactions/earnings')
        .then(res => { if (active) setEarnings(res.data); })
        .catch(err => console.error('Earnings fetch error:', err))
        .finally(() => { if (active) setIsLoading(false); });

      return () => { active = false; };
    }, [])
  );

  const data = earnings || {};
  const transactions = data.recentTransactions || [];

  const renderTransaction = ({ item, index }) => {
    const isEarning = item.type === 'earning';
    return (
      <Animated.View 
        entering={FadeInDown.delay(300 + index * 80)}
        style={styles.transactionItem}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: isEarning ? '#D1FAE5' : '#FEE2E2' }]}>
            <Icon 
              name={isEarning ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color={isEarning ? '#10B981' : '#EF4444'} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.description || (isEarning ? 'Session Earning' : 'Withdrawal')}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: isEarning ? '#10B981' : '#111827' }]}>
            {isEarning ? '+' : '-'}{formatINR(item.amount)}
          </Text>
          <Text style={[styles.transactionStatus, { color: item.status === 'pending' ? '#F59E0B' : '#9CA3AF' }]}>
            {item.status}
          </Text>
        </View>
      </Animated.View>
    );
  };

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
            <Text style={styles.balanceLabel}>Available Balance</Text>
            {isLoading ? (
                <Skeleton width={150} height={36} style={{ marginVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            ) : (
                <Text style={styles.balanceValue}>{formatINR(data.availableBalance)}</Text>
            )}
            
            <View style={styles.balanceFooter}>
              <View>
                <Text style={styles.footerLabel}>This Month</Text>
                {isLoading ? (
                    <Skeleton width={100} height={18} style={{ marginTop: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                    <Text style={styles.footerValue}>+{formatINR(data.thisMonth)}</Text>
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
            <Icon name="calendar-check" size={20} color="#10B981" style={{ marginBottom: 6 }} />
            <Text style={styles.qStatLabel}>Today</Text>
            {isLoading ? <Skeleton width={60} height={18} /> : (
              <>
                <Text style={styles.qStatValue}>{formatINR(data.today)}</Text>
                <Text style={styles.qStatSub}>{data.todaySessions || 0} sessions</Text>
              </>
            )}
          </View>
          <View style={styles.qStat}>
            <Icon name="cash-multiple" size={20} color="#8B5CF6" style={{ marginBottom: 6 }} />
            <Text style={styles.qStatLabel}>Total Earned</Text>
            {isLoading ? <Skeleton width={60} height={18} /> : (
              <>
                <Text style={styles.qStatValue}>{formatINR(data.totalEarned)}</Text>
                <Text style={styles.qStatSub}>{data.completedSessions || 0} sessions</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.quickStats2}>
          <View style={styles.qStat}>
            <Icon name="bank-transfer-out" size={20} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={styles.qStatLabel}>Withdrawn</Text>
            {isLoading ? <Skeleton width={60} height={18} /> : (
              <Text style={styles.qStatValue}>{formatINR(data.totalWithdrawn)}</Text>
            )}
          </View>
          <View style={styles.qStat}>
            <Icon name="clock-outline" size={20} color="#EF4444" style={{ marginBottom: 6 }} />
            <Text style={styles.qStatLabel}>Pending</Text>
            {isLoading ? <Skeleton width={60} height={18} /> : (
              <Text style={styles.qStatValue}>{formatINR(data.pendingAmount)}</Text>
            )}
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
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="cash-remove" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Complete sessions to start earning!</Text>
            </View>
          ) : (
            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => item._id}
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  balanceCardContainer: { marginVertical: 10 },
  balanceCard: { borderRadius: 32, padding: 32 },
  balanceLabel: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  footerLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  footerValue: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  withdrawText: { color: '#111827', fontWeight: '700', marginRight: 4 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  quickStats2: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  qStat: { flex: 1, backgroundColor: '#FAFAFA', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  qStatLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  qStatValue: { color: '#111827', fontSize: 18, fontWeight: '800' },
  qStatSub: { color: '#9CA3AF', fontSize: 12, fontWeight: '500', marginTop: 2 },
  transactionsSection: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAllText: { fontSize: 14, color: '#10B981', fontWeight: '700' },
  listContainer: { paddingBottom: 20 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  transactionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  transactionDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', marginLeft: 8 },
  transactionAmount: { fontSize: 16, fontWeight: '800' },
  transactionStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});

export default EarningsScreen;
