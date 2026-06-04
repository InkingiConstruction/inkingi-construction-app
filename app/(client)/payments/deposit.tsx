// app/(client)/payments/deposit.tsx
/**
 * @fileoverview Deposit funds screen with multiple payment methods
 * Supports MTN MoMo and Stripe-powered bank/card deposits
 * Minimum deposit: 100,000 RWF
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
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { COLORS } from '@/constants/colors';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';

type PaymentMethod = 'mtn_momo' | 'bank_transfer';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  fields: { key: string; label: string; placeholder: string; keyboardType?: string }[];
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    icon: 'phone-portrait-outline',
    color: '#FFD700',
    fields: [
      { key: 'phoneNumber', label: 'MTN Phone Number', placeholder: '+250 788 123 456', keyboardType: 'phone-pad' },
    ],
  },  
  {
    id: 'bank_transfer',
    name: 'Bank / Card via Stripe',
    icon: 'card-outline',
    color: '#3B82F6',
    fields: [],
  },
];

type EscrowAccount = {
  id: string;
  currency?: string;
  projectId?: string;
};

type StripeDepositResponse = {
  message: string;
  data: {
    clientSecret: string;
    paymentIntentId: string;
  };
};

type CreateEscrowResponse = {
  message: string;
  escrowAccount: EscrowAccount;
};

export default function DepositScreen() {
  const { vaultId, projectId, projectName } = useLocalSearchParams<{ vaultId: string; projectId: string; projectName: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mtn_momo');
  const [amount, setAmount] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const actualProjectId = vaultId || projectId || "";

  const currentMethod = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;

  const handleAmountChange = (text: string) => {
    const cleanNumber = text.replace(/[^0-9]/g, '');
    setAmount(cleanNumber);
  };

  const validateForm = () => {
    const amountNum = parseInt(amount, 10);
    if (!amount || amountNum < 100000) {
      Alert.alert('Invalid Amount', 'Minimum deposit amount is 100,000 RWF');
      return false;
    }

    for (const field of currentMethod.fields) {
      if (!formData[field.key]) {
        Alert.alert('Missing Information', `Please enter your ${field.label}`);
        return false;
      }
    }

    return true;
  };

  const resolveEscrowAccount = async () => {
    if (!actualProjectId) throw new Error("Project is required before funding escrow.");

    const existing = await api.get<EscrowAccount[]>(ENDPOINTS.ESCROW_ACCOUNTS.LIST, {
      params: { projectId: actualProjectId },
    });

    const escrow = existing.data[0];
    if (escrow?.id) return escrow;

    const created = await api.post<CreateEscrowResponse>(ENDPOINTS.ESCROW_ACCOUNTS.LIST, {
      projectId: actualProjectId,
      currency: "rwf",
    });

    return created.data.escrowAccount;
  };

  const handleStripeDeposit = async (amountNum: number) => {
    const escrow = await resolveEscrowAccount();
    const response = await api.post<StripeDepositResponse>(
      ENDPOINTS.ESCROW_ACCOUNTS.DEPOSIT_STRIPE(escrow.id),
      {
        amount: amountNum,
        currency: escrow.currency || "rwf",
      },
    );

    const clientSecret = response.data.data.clientSecret;
    if (!clientSecret) throw new Error("Stripe did not return a payment client secret.");

    const initResult = await initPaymentSheet({
      merchantDisplayName: "Inkingi Construction",
      paymentIntentClientSecret: clientSecret,
      returnURL: "inkingi://stripe-redirect",
    });

    if (initResult.error) {
      throw new Error(initResult.error.message);
    }

    const presentResult = await presentPaymentSheet();
    if (presentResult.error) {
      throw new Error(presentResult.error.message);
    }

    Alert.alert(
      "Payment completed",
      `${amountNum.toLocaleString()} RWF was paid through Stripe. Escrow will update after payment confirmation.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const handleDeposit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const amountNum = parseInt(amount, 10);

      if (selectedMethod === 'bank_transfer') {
        await handleStripeDeposit(amountNum);
        return;
      }

      const escrow = await resolveEscrowAccount();
      await api.post(ENDPOINTS.ESCROW_ACCOUNTS.DEPOSIT_MTN(escrow.id), {
        amount: amountNum,
        phoneNumber: formData.phoneNumber,
      });

      Alert.alert(
        'Payment Initiated',
        `A payment request has been sent to ${formData.phoneNumber || 'your phone'}. Please check your phone and complete the payment.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert('Deposit Failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
            Deposit Funds
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
            {projectName || 'Project Escrow'}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>Amount (RWF)</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>RWF</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>
          <Text style={styles.helperText}>Minimum: 100,000 RWF</Text>
        </View>

        {/* Payment Methods */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={{ gap: 12 }}>
            {PAYMENT_METHODS.map((method) => (
              <Pressable
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardSelected,
                ]}
              >
                <View style={styles.methodRadio}>
                  {selectedMethod === method.id && <View style={styles.methodRadioSelected} />}
                </View>
                <View
                  style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}
                >
                  <Ionicons name={method.icon} size={24} color={method.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDesc}>
                    {method.id === 'bank_transfer' ? 'Stripe secured checkout' : 'Mobile money prompt'}
                  </Text>
                </View>
                {selectedMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dynamic Fields */}
        {currentMethod.fields.map((field) => (
          <View key={field.key} style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType={field.keyboardType as any || 'default'}
              value={formData[field.key] || ''}
              onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
            />
          </View>
        ))}

        {/* Summary */}
        {amount && parseInt(amount, 10) >= 100000 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Deposit Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>{parseInt(amount, 10).toLocaleString()} RWF</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Method:</Text>
              <Text style={styles.summaryValue}>{currentMethod.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee:</Text>
              <Text style={styles.summaryValue}>0 RWF</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{parseInt(amount, 10).toLocaleString()} RWF</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleDeposit}
          disabled={loading || !amount || parseInt(amount, 10) < 100000}
          style={[
            styles.submitButton,
            (loading || !amount || parseInt(amount, 10) < 100000) && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>
                {selectedMethod === 'bank_transfer' ? 'Pay with Stripe' : 'Confirm Deposit'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.securityText}>
            All deposits are secured by escrow and encrypted
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.MUTED,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 12,
  },
  methodCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}05`,
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  methodDesc: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  summaryCard: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.MUTED,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});
