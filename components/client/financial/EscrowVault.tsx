// components/financial/EscrowVault.tsx
/**
 * @fileoverview Escrow vault component - Displays project escrow balance and actions
 * Shows available balance, locked funds, and provides deposit/withdraw buttons
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';

export interface EscrowVaultData {
  id: string;
  projectId: string;
  projectName: string;
  balance: number;
  lockedBalance: number;
  currency: string;
  status: 'active' | 'frozen';
}

interface EscrowVaultProps {
  vault: EscrowVaultData;
  onDeposit?: (vault: EscrowVaultData) => void;
  onWithdraw?: (vault: EscrowVaultData) => void;
  onRelease?: (vault: EscrowVaultData, amount: number) => void;
  compact?: boolean;
  showBalance?: boolean;
}

export default function EscrowVault({ 
  vault, 
  onDeposit, 
  onWithdraw, 
  onRelease,
  compact = false,
  showBalance = true
}: EscrowVaultProps) {
  const availableBalance = vault.balance - vault.lockedBalance;

  if (compact) {
    return (
      <Pressable
        onPress={() => router.push(`/payments/vault-detail?id=${vault.id}` as any)}
        style={{
          backgroundColor: COLORS.SURFACE,
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: COLORS.BORDER_LIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>
            {vault.projectName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
            {vault.currency} Escrow
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.PRIMARY }}>
            {showBalance ? `${vault.balance.toLocaleString()} RWF` : '•••••• RWF'}
          </Text>
          {vault.lockedBalance > 0 && (
            <Text style={{ fontSize: 10, color: COLORS.WARNING }}>
              {showBalance ? `${vault.lockedBalance.toLocaleString()} locked` : '•••••• locked'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
            {vault.projectName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
            Escrow Account • {vault.currency}
          </Text>
        </View>
        {vault.status === 'frozen' && (
          <View style={{ backgroundColor: COLORS.ERROR + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, color: COLORS.ERROR }}>Frozen</Text>
          </View>
        )}
      </View>

      {/* Balance */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY }}>Total Balance</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: COLORS.PRIMARY, marginTop: 4 }}>
          {showBalance ? `${vault.balance.toLocaleString()} RWF` : '•••••• RWF'}
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
          <View>
            <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT }}>Available</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.SUCCESS }}>
              {showBalance ? `${availableBalance.toLocaleString()} RWF` : '•••••• RWF'}
            </Text>
          </View>
          {vault.lockedBalance > 0 && (
            <View>
              <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT }}>Locked (Dispute)</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.WARNING }}>
                {showBalance ? `${vault.lockedBalance.toLocaleString()} RWF` : '•••••• RWF'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {vault.balance > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ height: 6, backgroundColor: COLORS.MUTED, borderRadius: 3, overflow: 'hidden' }}>
            <View 
              style={{
                width: `${(availableBalance / vault.balance) * 100}%`,
                height: 6,
                backgroundColor: COLORS.SUCCESS,
              }}
            />
          </View>
          <Text style={{ fontSize: 10, color: COLORS.TEXT_LIGHT, marginTop: 6 }}>
            {((availableBalance / vault.balance) * 100).toFixed(0)}% available
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={() => onDeposit?.(vault)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: COLORS.PRIMARY,
            borderRadius: 12,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Deposit</Text>
        </Pressable>
        
        <Pressable
          onPress={() => onWithdraw?.(vault)}
          disabled={availableBalance < 100000}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: availableBalance >= 100000 ? COLORS.MUTED : COLORS.BORDER,
            borderRadius: 12,
            paddingVertical: 12,
            opacity: availableBalance >= 100000 ? 1 : 0.5,
          }}
        >
          <Ionicons name="arrow-up-circle-outline" size={18} color={COLORS.TEXT_PRIMARY} />
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: '600', fontSize: 14 }}>Withdraw</Text>
        </Pressable>
      </View>

      {/* Release Payments Section */}
      {onRelease && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.BORDER_LIGHT }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.TEXT_SECONDARY, marginBottom: 8 }}>
            Pending Milestone Payments
          </Text>
          <Pressable
            onPress={() => onRelease(vault, 0)}
            style={{
              backgroundColor: COLORS.PRIMARY_LIGHT,
              borderRadius: 10,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 14, color: COLORS.PRIMARY, fontWeight: '500' }}>
              Release milestone payment
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.PRIMARY} />
          </Pressable>
        </View>
      )}
    </View>
  );
}