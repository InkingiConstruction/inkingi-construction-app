import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface SupplierPaymentStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PAYMENT_METHODS = [
  { id: 'escrow', label: 'InkingiPro Escrow Payment (Recommended)', desc: 'Secure payment held in escrow until delivery is verified' },
  { id: 'momo', label: 'MTN Mobile Money', desc: 'Direct mobile money transfer' },
  { id: 'airtel', label: 'Airtel Money', desc: 'Direct Airtel money transfer' },
  { id: 'bank', label: 'Bank Transfer / EFT', desc: 'For bulk transactions and large billing invoices' },
  { id: 'cheque', label: 'Company Cheques', desc: 'Subject to clearance prior to shipping cargo' },
];

export default function SupplierPaymentStep({ data, onUpdate, onNext, onPrev }: SupplierPaymentStepProps) {
  const [selectedPayments, setSelectedPayments] = useState<string[]>(
    data.roleSpecific?.paymentMethods || ['escrow']
  );

  const togglePayment = (id: string) => {
    if (selectedPayments.includes(id)) {
      // Don't let them deselect everything
      if (selectedPayments.length === 1) return;
      setSelectedPayments(prev => prev.filter(p => p !== id));
    } else {
      setSelectedPayments(prev => [...prev, id]);
    }
  };

  const handleContinue = () => {
    if (selectedPayments.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one supported payment method.');
      return;
    }

    onUpdate({
      roleSpecific: {
        ...data.roleSpecific,
        paymentMethods: selectedPayments,
      },
    });

    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={onPrev} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment Methods</Text>
        <Text style={styles.subtitle}>
          Select all options you accept for material orders. Using escrow is highly recommended for client protection.
        </Text>
      </View>

      {/* Checklist */}
      <View style={styles.list}>
        {PAYMENT_METHODS.map((pay) => {
          const isSelected = selectedPayments.includes(pay.id);
          return (
            <Pressable
              key={pay.id}
              onPress={() => togglePayment(pay.id)}
              style={[
                styles.itemCard,
                isSelected ? styles.itemCardActive : null,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{pay.label}</Text>
                <Text style={styles.itemDesc}>{pay.desc}</Text>
              </View>
              <View style={[styles.checkbox, isSelected ? styles.checkboxChecked : null]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Continue */}
      <Pressable
        onPress={handleContinue}
        disabled={selectedPayments.length === 0}
        style={[
          styles.submitBtn,
          selectedPayments.length > 0 ? styles.submitBtnActive : styles.submitBtnDisabled,
        ]}
      >
        <Text style={styles.submitBtnText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
    lineHeight: 18,
  },
  list: {
    gap: 12,
    marginBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  itemCardActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.MUTED,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
