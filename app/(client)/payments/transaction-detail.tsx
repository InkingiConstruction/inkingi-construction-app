// app/(client)/payments/transaction-detail.tsx
/**
 * @fileoverview Transaction detail screen showing full transaction information
 * Displays all details of a specific transaction including status, amount, and timeline
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';

interface TransactionDetail {
  id: string;
  type: 'deposit' | 'release' | 'withdraw' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'mtn_momo' | 'airtel_money' | 'bank_transfer';
  reference: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
  milestoneId?: string;
  milestoneName?: string;
  projectName?: string;
  metadata?: Record<string, any>;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await api.get<TransactionDetail>(ENDPOINTS.TRANSACTIONS.DETAIL(id));
      return response.data;
    },
    enabled: !!id,
  });

  const getTransactionIcon = () => {
    if (!transaction) return { name: 'swap-horizontal', color: COLORS.TEXT_SECONDARY };
    switch (transaction.type) {
      case 'deposit':
        return { name: 'arrow-down-circle', color: '#10B981' };
      case 'release':
        return { name: 'arrow-up-circle', color: '#F59E0B' };
      case 'withdraw':
        return { name: 'arrow-up-circle', color: '#EF4444' };
      default:
        return { name: 'swap-horizontal', color: COLORS.TEXT_SECONDARY };
    }
  };

  const getStatusColor = () => {
    if (!transaction) return COLORS.TEXT_SECONDARY;
    switch (transaction.status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusText = () => {
    if (!transaction) return '';
    switch (transaction.status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return transaction.status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    if (!transaction) return;
    await Share.share({
      message: `Transaction ${transaction.reference}\nAmount: ${transaction.amount.toLocaleString()} RWF\nStatus: ${getStatusText()}\nDate: ${formatDate(transaction.createdAt)}`,
    });
  };

  const getMethodLabel = () => {
    if (!transaction) return '';
    switch (transaction.method) {
      case 'mtn_momo':
        return 'MTN Mobile Money';
      case 'airtel_money':
        return 'Airtel Money';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return transaction.method;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.TEXT_LIGHT} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginTop: 16 }}>
            Transaction Not Found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: COLORS.PRIMARY }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const icon = getTransactionIcon();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>

          {/* Status Icon */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: icon.color || `${icon.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name={icon.name as any} size={40} color={icon.color} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: COLORS.PRIMARY, marginTop: 8 }}>
              {transaction.amount.toLocaleString()} RWF
            </Text>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: `${getStatusColor()}20`,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor() }}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Transaction Details Card */}
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.BORDER_LIGHT,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginBottom: 16 }}>
              Transaction Details
            </Text>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Reference ID</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                  {transaction.reference}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Date & Time</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Method</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                  {getMethodLabel()}
                </Text>
              </View>

              {transaction.projectName && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Project</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                    {transaction.projectName}
                  </Text>
                </View>
              )}

              {transaction.milestoneName && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY }}>Milestone</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                    {transaction.milestoneName}
                  </Text>
                </View>
              )}

              {transaction.description && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 4 }}>
                    Description
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                    {transaction.description}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Timeline */}
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.BORDER_LIGHT,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginBottom: 16 }}>
              Timeline
            </Text>

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 24, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: transaction.status === 'completed' ? '#10B981' : '#F59E0B',
                    }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                    Transaction Initiated
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              </View>

              {transaction.status === 'completed' && transaction.completedAt && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 24, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#10B981',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.TEXT_PRIMARY }}>
                      Transaction Completed
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
                      {formatDate(transaction.completedAt)}
                    </Text>
                  </View>
                </View>
              )}

              {transaction.status === 'failed' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 24, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#EF4444',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.ERROR }}>
                      Transaction Failed
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
                      Please contact support for assistance
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleShare}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: COLORS.MUTED,
                borderRadius: 12,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="share-outline" size={20} color={COLORS.TEXT_PRIMARY} />
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: '600' }}>Share Receipt</Text>
            </Pressable>

            {transaction.status === 'pending' && (
              <Pressable
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderRadius: 12,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name="refresh-outline" size={20} color={COLORS.PRIMARY} />
                <Text style={{ color: COLORS.PRIMARY, fontWeight: '600' }}>Check Status</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}