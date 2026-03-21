import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../../services/apiClient';

const WithdrawScreen = ({ navigation }) => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const { data } = await apiClient.get('/transactions/earnings');
      setAvailableBalance(data.availableBalance || 0);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch balance');
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      return Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
    }
    if (withdrawAmount > availableBalance) {
      return Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance.');
    }
    if (!upiId.trim()) {
      return Alert.alert('UPI Required', 'Please enter a valid UPI ID for the transfer.');
    }

    setIsLoading(true);
    try {
      await apiClient.post('/transactions/withdraw', {
        amount: withdrawAmount,
        upiId: upiId.trim()
      });
      Alert.alert('Success', `Withdrawal of ₹${withdrawAmount} requested successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to process withdrawal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(100)} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {isFetchingBalance ? (
            <ActivityIndicator color="#10B981" size="large" style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.balanceAmount}>₹{availableBalance}</Text>
          )}
          <View style={styles.badgeContainer}>
            <View style={styles.secureBadge}>
              <Icon name="shield-check" size={16} color="#059669" />
              <Text style={styles.secureText}>Instant & Secure</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
          <Text style={styles.inputLabel}>Amount to Withdraw</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              maxLength={7}
            />
          </View>
          
          <Text style={styles.inputLabel}>UPI ID</Text>
          <View style={styles.inputWrapperSecondary}>
            <Icon name="contactless-payment" size={20} color="#6B7280" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. yourname@upi"
              placeholderTextColor="#9CA3AF"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.infoBox}>
            <Icon name="information-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Funds will be transferred to your UPI ID instantly. 
              Minimal processing fees may apply.
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitBtn, 
            (!amount || !upiId || isFetchingBalance || isLoading || Number(amount) > availableBalance) && styles.submitBtnDisabled
          ]} 
          onPress={handleWithdraw}
          disabled={!amount || !upiId || isFetchingBalance || isLoading || Number(amount) > availableBalance}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Withdraw Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FAFAFA'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  scrollContent: { padding: 24, paddingBottom: 100 },
  balanceCard: {
    backgroundColor: '#111827', borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }
  },
  balanceLabel: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  balanceAmount: { color: '#FFF', fontSize: 48, fontWeight: '800', marginVertical: 8 },
  badgeContainer: { flexDirection: 'row', marginTop: 8 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  secureText: { color: '#059669', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  formContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#10B981', paddingBottom: 10, marginBottom: 24 },
  currencySymbol: { fontSize: 36, fontWeight: '700', color: '#111827', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: '#111827', padding: 0 },
  inputWrapperSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  textInput: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20, marginLeft: 10, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  submitBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  submitBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});

export default WithdrawScreen;
