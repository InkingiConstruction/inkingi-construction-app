// app/(client)/payments/index.tsx
/**
 * @fileoverview Project Wallet Hub
 * Shows per-project fund balances stored in AsyncStorage.
 * Passcode is verified once per session; subsequent actions skip re-prompting.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { api } from '@/api/api';
import { ENDPOINTS } from '@/api/endpoints';
import {
  hasPasscode,
  isPasscodeSessionUnlocked,
} from '@/utils/SecurityUtils';
import {
  getAllFunds,
  ensureProjectFund,
  formatRWF,
  ProjectFund,
} from '@/utils/projectFunds';
import VerifyPasscodeModal from './verify-passcode';
import { useSampleFlowStore } from '@/store/sampleFlow.store';

interface Project {
  id: string;
  name: string;
  budget?: number;
  totalBudget?: number;
  status?: string;
}

export default function ClientPayments() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [funds, setFunds] = useState<Record<string, ProjectFund>>({});
  const [passcodeModal, setPasscodeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'view_balance' | null>(null);

  const { bankAccounts, linkBankAccount, unlinkBankAccount } = useSampleFlowStore();

  // ── Load projects from API ──────────────────────────────────────────────────
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['client-projects', refreshKey],
    queryFn: async () => {
      const res = await api.get<Project[]>(ENDPOINTS.PROJECTS.LIST);
      return res.data;
    },
  });

  // ── Load / sync fund wallets ────────────────────────────────────────────────
  const loadFunds = useCallback(async (projectList: Project[]) => {
    for (const p of projectList) {
      await ensureProjectFund(p.id, p.name, p.budget ?? p.totalBudget ?? 0);
    }
    const all = await getAllFunds();
    setFunds(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const ready = await hasPasscode();
        if (!ready) {
          router.push('/(client)/payments/passcode-setup');
          return;
        }
        if (projects.length > 0) await loadFunds(projects);
        else {
          const all = await getAllFunds();
          setFunds(all);
        }
      })();
    }, [projects, loadFunds])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    await loadFunds(projects);
    setRefreshing(false);
  };

  // ── Passcode gate ───────────────────────────────────────────────────────────
  const requirePasscode = (action: typeof pendingAction, onUnlocked: () => void) => {
    if (isPasscodeSessionUnlocked()) {
      onUnlocked();
    } else {
      setPendingAction(action);
      setPasscodeModal(true);
    }
  };

  const onPasscodeSuccess = () => {
    if (pendingAction === 'view_balance') setBalanceVisible(true);
    setPasscodeModal(false);
    setPendingAction(null);
  };

  // ── Derived totals ──────────────────────────────────────────────────────────
  const totalBalance = Object.values(funds).reduce((s, f) => s + f.balance, 0);
  const totalBudget = Object.values(funds).reduce((s, f) => s + f.budget, 0);

  const handleAddFunds = (project: Project) => {
    requirePasscode(null, () => {
      router.push({
        pathname: '/(client)/payments/deposit', 
        params: {
          projectId: project.id,
          projectName: project.name,
          budget: String(project.budget ?? project.totalBudget ?? 0),
          currentBalance: String(funds[project.id]?.balance ?? 0),
        },
      });
    });
  };

  const handleWithdraw = (project: Project) => {
    const fund = funds[project.id];
    if (!fund || fund.balance === 0) return;
    requirePasscode(null, () => {
      router.push({
        pathname: '/(client)/payments/withdraw',
        params: {
          vaultId: project.id,
          balance: String(fund.balance),
        },
      });
    });
  };

  if (projectsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
            Project Wallets
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 3 }}>
            Manage funds for each of your projects
          </Text>
        </View>

        {/* ── Total Balance Card ── */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View style={{
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: COLORS.INK,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
          }}>
            {/* Top row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
                  TOTAL FUNDED
                </Text>
                <Text style={{ color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: 4 }}>
                  {balanceVisible ? formatRWF(totalBalance) : '••••••'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (balanceVisible) {
                    setBalanceVisible(false);
                  } else {
                    requirePasscode('view_balance', () => setBalanceVisible(true));
                  }
                }}
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 10 }}
              >
                <Ionicons
                  name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 }} />

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>PROJECTS</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                  {projects.length}
                </Text>
              </View>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>TOTAL BUDGET</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                  {balanceVisible ? formatRWF(totalBudget) : '••••••'}
                </Text>
              </View>
              {totalBudget > 0 && (
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>FUNDED</Text>
                  <Text style={{ color: COLORS.SUCCESS, fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                    {Math.round((totalBalance / totalBudget) * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push('/(client)/payments/passcode-setup')}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 14, borderRadius: 14,
              backgroundColor: pressed ? COLORS.PRIMARY + 'DD' : COLORS.PRIMARY,
            })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Change Passcode</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(client)/create-project')}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, paddingVertical: 14, borderRadius: 14,
              backgroundColor: COLORS.SURFACE,
              borderWidth: 1, borderColor: COLORS.BORDER_LIGHT,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="briefcase-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={{ color: COLORS.PRIMARY, fontWeight: '700', fontSize: 14 }}>New Project</Text>
          </Pressable>
        </View>

        {/* ── Linked Accounts (Bank of Kigali & Mobile Money) ── */}
        {/* <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.TEXT_PRIMARY, marginBottom: 10 }}>
            Linked Payment Sources
          </Text>
          <View style={{ gap: 10 }}>
            {bankAccounts.map(acc => (
              <View
                key={acc.type}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: acc.type === 'bk' ? '#007E6E15' : '#FFD70015',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Ionicons 
                      name={acc.type === 'bk' ? 'business-outline' : 'phone-portrait-outline'} 
                      size={20} 
                      color={acc.type === 'bk' ? COLORS.PRIMARY : '#D97706'} 
                    />
                  </View>
                  <View>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: 'bold', fontSize: 14 }}>
                      {acc.bankName}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 1 }}>
                      {acc.linked ? `Linked • ${acc.accountNumber}` : 'Not Connected'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {acc.linked ? (
                    <>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: 'bold', fontSize: 13 }}>
                        {formatRWF(acc.balance)}
                      </Text>
                      <Pressable 
                        onPress={() => unlinkBankAccount(acc.type)}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FEE2E2', borderRadius: 6 }}
                      >
                        <Text style={{ color: COLORS.ERROR, fontSize: 10, fontWeight: 'bold' }}>Unlink</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable 
                      onPress={() => {
                        Alert.prompt(
                          `Connect ${acc.bankName}`,
                          `Enter your ${acc.type === 'bk' ? 'Account Number' : 'MoMo Phone Number'}:`,
                          [
                            { text: 'Cancel' },
                            { 
                              text: 'Link', 
                              onPress: (val:any) => {
                                if (val) {
                                  linkBankAccount(acc.type, { 
                                    accountName: `Client Account - ${acc.type.toUpperCase()}`, 
                                    accountNumber: val 
                                  });
                                }
                              } 
                            }
                          ]
                        );
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8 }}
                    >
                      <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 11, fontWeight: 'bold' }}>Connect</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View> */} 

        {/* ── Project Wallet Cards ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.TEXT_PRIMARY, marginBottom: 14 }}>
            Project Wallets
          </Text>

          {projects.length === 0 ? (
            <View style={{
              backgroundColor: COLORS.SURFACE, borderRadius: 18,
              padding: 36, alignItems: 'center',
              borderWidth: 1, borderColor: COLORS.BORDER_LIGHT,
            }}>
              <Ionicons name="wallet-outline" size={52} color={COLORS.TEXT_LIGHT} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginTop: 14 }}>
                No Projects Yet
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: 'center', marginTop: 6 }}>
                Create a project to get a dedicated wallet for tracking funds.
              </Text>
              <Pressable
                onPress={() => router.push('/(client)/create-project')}
                style={{
                  marginTop: 18, backgroundColor: COLORS.PRIMARY,
                  paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create Project</Text>
              </Pressable>
            </View>
          ) : (
            projects.map(project => {
              const fund = funds[project.id];
              const balance = fund?.balance ?? 0;
              const budget = fund?.budget ?? project.budget ?? project.totalBudget ?? 0;
              const pct = budget > 0 ? Math.min(100, Math.round((balance / budget) * 100)) : 0;
              const recentTx = fund?.transactions?.[0];

              return (
                <View
                  key={project.id}
                  style={{
                    backgroundColor: COLORS.SURFACE,
                    borderRadius: 18,
                    padding: 18,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: COLORS.BORDER_LIGHT,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  {/* Project name row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: COLORS.PRIMARY_LIGHT,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Ionicons name="business-outline" size={20} color={COLORS.PRIMARY} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.TEXT_PRIMARY }} numberOfLines={1}>
                        {project.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 }}>
                        {fund?.transactions?.length ?? 0} transaction{(fund?.transactions?.length ?? 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: pct >= 100 ? COLORS.SUCCESS + '20' : COLORS.PRIMARY_LIGHT,
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                    }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: pct >= 100 ? COLORS.SUCCESS : COLORS.PRIMARY,
                      }}>
                        {pct}% funded
                      </Text>
                    </View>
                  </View>

                  {/* Balance */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.4 }}>
                      CURRENT BALANCE
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, marginTop: 2 }}>
                      {balanceVisible ? formatRWF(balance) : '•••••••'}
                    </Text>
                    {budget > 0 && (
                      <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
                        of {formatRWF(budget)} budget
                      </Text>
                    )}
                  </View>

                  {/* Progress bar */}
                  {budget > 0 && (
                    <View style={{
                      height: 6, backgroundColor: COLORS.MUTED,
                      borderRadius: 3, marginBottom: 14, overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%', borderRadius: 3,
                        width: `${pct}%`,
                        backgroundColor: pct >= 100 ? COLORS.SUCCESS : COLORS.PRIMARY,
                      }} />
                    </View>
                  )}

                  {/* Last transaction */}
                  {recentTx && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: COLORS.MUTED, borderRadius: 10,
                      paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14,
                    }}>
                      <Ionicons
                        name={recentTx.type === 'deposit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                        size={16}
                        color={recentTx.type === 'deposit' ? COLORS.SUCCESS : COLORS.ERROR}
                      />
                      <Text style={{ flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, marginLeft: 8 }}>
                        {recentTx.type === 'deposit' ? '+' : '-'}{formatRWF(recentTx.amount)} via {recentTx.methodLabel}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT }}>
                        {new Date(recentTx.date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => handleAddFunds(project)}
                      style={({ pressed }) => ({
                        flex: 1, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 6,
                        backgroundColor: pressed ? COLORS.PRIMARY + 'DD' : COLORS.PRIMARY,
                        paddingVertical: 11, borderRadius: 12,
                      })}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Add Funds</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleWithdraw(project)}
                      disabled={balance === 0}
                      style={({ pressed }) => ({
                        flex: 1, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 6,
                        backgroundColor: COLORS.SURFACE,
                        borderWidth: 1,
                        borderColor: balance === 0 ? COLORS.BORDER_LIGHT : COLORS.PRIMARY,
                        paddingVertical: 11, borderRadius: 12,
                        opacity: pressed ? 0.7 : balance === 0 ? 0.4 : 1,
                      })}
                    >
                      <Ionicons name="arrow-up-outline" size={18} color={balance === 0 ? COLORS.TEXT_LIGHT : COLORS.PRIMARY} />
                      <Text style={{
                        fontSize: 14, fontWeight: '700',
                        color: balance === 0 ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                      }}>
                        Withdraw
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Passcode Modal */}
      <VerifyPasscodeModal
        visible={passcodeModal}
        onClose={() => { setPasscodeModal(false); setPendingAction(null); }}
        onSuccess={onPasscodeSuccess}
        actionType="unlock_balance"
      />
    </SafeAreaView>
  );
}