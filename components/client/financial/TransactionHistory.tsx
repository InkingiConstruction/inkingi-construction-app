// components/financial/TransactionHistory.tsx
/**
 * @fileoverview Transaction history list with filters and pagination
 * Displays all financial transactions with filtering by type and date
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';

export interface Transaction {
  id: string;
  type: 'deposit' | 'release' | 'withdraw' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'mtn_momo' | 'airtel_money' | 'bank_transfer';
  reference: string;
  description?: string;
  createdAt: string;
  milestoneId?: string;
  milestoneName?: string;
  projectName?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showFilters?: boolean;
}

type FilterType = 'all' | 'deposit' | 'release' | 'withdraw';

export default function TransactionHistory({
  transactions,
  isLoading,
  onRefresh,
  onLoadMore,
  hasMore,
  showFilters = true,
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return { name: 'arrow-down-circle', color: '#10B981', bg: '#10B98115' };
      case 'release':
        return { name: 'arrow-up-circle', color: '#F59E0B', bg: '#F59E0B15' };
      case 'withdraw':
        return { name: 'arrow-up-circle', color: '#EF4444', bg: '#EF444415' };
      default:
        return { name: 'swap-horizontal', color: COLORS.TEXT_SECONDARY, bg: COLORS.MUTED };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/(client)/payments/transaction-detail?id=${transaction.id}`);
  };

  if (isLoading && transactions.length === 0) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={{ marginTop: 12, color: COLORS.TEXT_SECONDARY }}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Filter Tabs */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
        >
          {[
            { id: 'all', label: 'All', icon: 'list-outline' },
            { id: 'deposit', label: 'Deposits', icon: 'arrow-down-outline' },
            { id: 'release', label: 'Releases', icon: 'arrow-up-outline' },
            { id: 'withdraw', label: 'Withdrawals', icon: 'cash-outline' },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setFilter(tab.id as FilterType)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === tab.id ? COLORS.PRIMARY : COLORS.MUTED,
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={filter === tab.id ? '#FFF' : COLORS.TEXT_SECONDARY}
              />
              <Text
                style={{
                  color: filter === tab.id ? '#FFF' : COLORS.TEXT_SECONDARY,
                  fontWeight: filter === tab.id ? '600' : '400',
                  fontSize: 14,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Transaction List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.PRIMARY]} />
        }
        onScroll={({ nativeEvent }) => {
          const isNearBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 100;
          if (isNearBottom && hasMore && !isLoading && onLoadMore) {
            onLoadMore();
          }
        }}
        scrollEventThrottle={16}
      >
        {filteredTransactions.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              marginTop: 40,
            }}
          >
            <Ionicons name="receipt-outline" size={64} color={COLORS.TEXT_LIGHT} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginTop: 16 }}>
              No transactions
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 8, textAlign: 'center' }}>
              {filter === 'all' 
                ? 'Your transactions will appear here' 
                : `No ${filter} transactions found`}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction, index) => {
            const icon = getTransactionIcon(transaction.type);
            return (
              <Pressable
                key={transaction.id}
                onPress={() => handleTransactionPress(transaction)}
                style={({ pressed }) => ({
                  backgroundColor: COLORS.SURFACE,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: COLORS.BORDER_LIGHT,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: icon.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT_PRIMARY }}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: transaction.type === 'deposit' ? '#10B981' : 
                                 transaction.type === 'withdraw' ? '#EF4444' : COLORS.TEXT_PRIMARY,
                        }}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} RWF
                      </Text>
                    </View>
                    
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4 }}>
                      {transaction.projectName || transaction.description || transaction.reference}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT }}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          backgroundColor: `${getStatusColor(transaction.status)}20`,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: getStatusColor(transaction.status) }}>
                          {getStatusText(transaction.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        {isLoading && transactions.length > 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.PRIMARY} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}