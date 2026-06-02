// app/(client)/payments/withdraw.tsx
/**
 * @fileoverview Withdraw funds screen from escrow vault
 * Supports MTN MoMo, Airtel Money, and Bank Transfer
 * Minimum withdrawal: 100,000 RWF
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/constants/colors';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';
import PaymentMethodSelector, { PaymentMethodType } from '@/components/client/financial/PaymentMethodSelector';

export default function WithdrawScreen() {
  const { vaultId, balance } = useLocalSearchParams<{ vaultId: string; balance: string }>();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('mtn_momo');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const maxAmount = parseInt(balance || '0', 10);
  const minAmount = 100000;

  const handleAmountChange = (text: string) => {
    const cleanNumber = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleanNumber, 10) || 0;
    if (num <= maxAmount) {
      setAmount(cleanNumber);
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseInt(amount, 10);
      return api.post(ENDPOINTS.ESCROW_ACCOUNTS.WITHDRAW(vaultId), {
        amount: amountNum,
        method: selectedMethod,
        ...formData,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['escrow-vaults'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      Alert.alert(
        'Withdrawal Initiated',
        `Your withdrawal request for ${parseInt(amount, 10).toLocaleString()} RWF has been submitted. Funds will be sent to your ${selectedMethod === 'bank_transfer' ? 'bank account' : 'mobile money'} within 1-3 business days.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error) => {
      Alert.alert('Withdrawal Failed', error instanceof Error ? error.message : 'Please try again');
    },
  });

  const validateForm = () => {
    const amountNum = parseInt(amount, 10);
    if (!amount || amountNum < minAmount) {
      Alert.alert('Invalid Amount', `Minimum withdrawal amount is ${minAmount.toLocaleString()} RWF`);
      return false;
    }
    
    if (amountNum > maxAmount) {
      Alert.alert('Insufficient Balance', `Maximum withdrawal amount is ${maxAmount.toLocaleString()} RWF`);
      return false;
    }

    const currentMethod = selectedMethod;
    if (currentMethod === 'mtn_momo' || currentMethod === 'airtel_money') {
      if (!formData.phoneNumber) {
        Alert.alert('Missing Information', 'Please enter your phone number');
        return false;
      }
      const phoneRegex = /^\+250[0-9]{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        Alert.alert('Invalid Phone', 'Please use format +250XXXXXXXXX');
        return false;
      }
    }

    if (currentMethod === 'bank_transfer') {
      if (!formData.accountName || !formData.bankName || !formData.accountNumber) {
        Alert.alert('Missing Information', 'Please complete all bank details');
        return false;
      }
    }

    return true;
  };

  const handleWithdraw = () => {
    if (!validateForm()) return;
    
    Alert.alert(
      'Confirm Withdrawal',
      `You are about to withdraw ${parseInt(amount, 10).toLocaleString()} RWF to your ${selectedMethod === 'bank_transfer' ? 'bank account' : 'mobile money'}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => withdrawMutation.mutate() },
      ]
    );
  };

  const isLoading = withdrawMutation.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
            Withdraw Funds
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
            Available balance: {maxAmount.toLocaleString()} RWF
          </Text>
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 8 }}>
            Amount (RWF)
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.SURFACE,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.BORDER,
            overflow: 'hidden',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: COLORS.TEXT_SECONDARY,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: COLORS.MUTED,
            }}>RWF</Text>
            <TextInput
              style={{ flex: 1, fontSize: 18, color: COLORS.TEXT_PRIMARY, paddingHorizontal: 16, paddingVertical: 14 }}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>
          <Text style={{ fontSize: 12, color: COLORS.TEXT_LIGHT, marginTop: 8 }}>
            Minimum: {minAmount.toLocaleString()} RWF • Maximum: {maxAmount.toLocaleString()} RWF
          </Text>
        </View>

        {/* Payment Method Selector */}
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          formData={formData}
          onFormChange={(key, value) => setFormData({ ...formData, [key]: value })}
          amount={parseInt(amount, 10) || 0}
          direction="withdraw"
        />

        {/* Summary */}
        {amount && parseInt(amount, 10) >= minAmount && (
          <View style={{
            backgroundColor: COLORS.MUTED,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginBottom: 12 }}>
              Withdrawal Summary
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Amount</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>
                {parseInt(amount, 10).toLocaleString()} RWF
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Fee</Text>
              <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>1,000 RWF</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.BORDER }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>You'll receive</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.PRIMARY }}>
                {(parseInt(amount, 10) - 1000).toLocaleString()} RWF
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleWithdraw}
          disabled={isLoading || !amount || parseInt(amount, 10) < minAmount}
          style={({ pressed }) => ({
            backgroundColor: (!amount || parseInt(amount, 10) < minAmount) ? COLORS.MUTED : COLORS.PRIMARY,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
              Withdraw Funds
            </Text>
          )}
        </Pressable>

        {/* Note */}
        <View style={{ marginTop: 24, padding: 16, backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 12 }}>
          <Text style={{ fontSize: 12, color: COLORS.PRIMARY, textAlign: 'center' }}>
            ⚡ Withdrawals are processed within 1-3 business days. Funds will be sent to your registered {selectedMethod === 'bank_transfer' ? 'bank account' : 'mobile money number'}.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}