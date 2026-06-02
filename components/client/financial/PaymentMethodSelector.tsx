// components/financial/PaymentMethodSelector.tsx
/**
 * @fileoverview Payment method selector for deposits and withdrawals
 * Supports MTN MoMo, Airtel Money, and Bank Transfer
 */

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export type PaymentMethodType = 'mtn_momo' | 'airtel_money' | 'bank_transfer';

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  }>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
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
    id: 'airtel_money',
    name: 'Airtel Money',
    icon: 'phone-portrait-outline',
    color: '#FF0000',
    fields: [
      { key: 'phoneNumber', label: 'Airtel Phone Number', placeholder: '+250 788 123 456', keyboardType: 'phone-pad' },
    ],
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: 'business-outline',
    color: '#3B82F6',
    fields: [
      { key: 'accountName', label: 'Account Holder Name', placeholder: 'John Doe' },
      { key: 'bankName', label: 'Bank Name', placeholder: 'Bank of Kigali' },
      { key: 'accountNumber', label: 'Account Number', placeholder: '1234567890', keyboardType: 'numeric' },
    ],
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  formData: Record<string, string>;
  onFormChange: (key: string, value: string) => void;
  amount?: number;
  direction?: 'deposit' | 'withdraw';
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
  formData,
  onFormChange,
  amount,
  direction = 'deposit',
}: PaymentMethodSelectorProps) {
  const currentMethod = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;

  return (
    <View>
      {/* Method Selection */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 12 }}>
        Payment Method
      </Text>
      <View style={{ gap: 12, marginBottom: 24 }}>
        {PAYMENT_METHODS.map((method) => (
          <Pressable
            key={method.id}
            onPress={() => onSelectMethod(method.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedMethod === method.id ? `${method.color}10` : COLORS.SURFACE,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: selectedMethod === method.id ? method.color : COLORS.BORDER,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedMethod === method.id ? method.color : COLORS.BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedMethod === method.id && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: method.color }} />
                )}
              </View>
            </View>
            
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${method.color}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name={method.icon} size={24} color={method.color} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>
                {method.name}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
                {direction === 'deposit' ? 'Instant • Secure' : '1-3 business days'}
              </Text>
            </View>
            
            {selectedMethod === method.id && (
              <Ionicons name="checkmark-circle" size={24} color={method.color} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Dynamic Fields */}
      {currentMethod.fields.map((field) => (
        <View key={field.key} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY, marginBottom: 8 }}>
            {field.label}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.MUTED,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.BORDER,
              paddingHorizontal: 16,
            }}
          >
            {field.key === 'phoneNumber' && (
              <View style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 16, color: COLORS.TEXT_SECONDARY }}>+250</Text>
              </View>
            )}
            <TextInput
              style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.TEXT_PRIMARY }}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              keyboardType={field.keyboardType || 'default'}
              value={formData[field.key] || ''}
              onChangeText={(text) => onFormChange(field.key, text)}
            />
          </View>
        </View>
      ))}

      {/* Fee Information */}
      <View
        style={{
          backgroundColor: COLORS.MUTED,
          borderRadius: 12,
          padding: 12,
          marginTop: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY }}>Transaction Fee</Text>
          <Text style={{ fontSize: 12, color: COLORS.TEXT_PRIMARY }}>
            {direction === 'deposit' ? '0 RWF' : '1,000 RWF'}
          </Text>
        </View>
        {amount && amount > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.BORDER }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>Total</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.PRIMARY }}>
              {direction === 'deposit' ? amount.toLocaleString() : (amount - 1000).toLocaleString()} RWF
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}