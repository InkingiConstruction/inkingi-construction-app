import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { formatRWF } from "@/utils/projectFunds";
import {
  hasPasscode,
  isPasscodeSessionUnlocked,
} from "@/utils/SecurityUtils";
import VerifyPasscodeModal from "./verify-passcode";

type WalletSummary = {
  id: string;
  balance: string | number;
  availableBalance?: string | number;
  currency: string;
  status: string;
  maxBalance?: string | number;
  totalInProjectVaults?: string | number;
  recentTransactions?: WalletTransaction[];
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: string | number;
  status: string;
  description?: string | null;
  createdAt: string;
};

type Vault = {
  escrowAccountId: string;
  projectId: string;
  projectName: string;
  projectStatus: string;
  currency: string;
  currentBalance: string | number;
  yourDeposits: string | number;
  yourReleases: string | number;
  yourNet: string | number;
};

export default function ClientPayments() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [passcodeModal, setPasscodeModal] = useState(false);

  const walletQuery = useQuery({
    queryKey: ["client-wallet"],
    queryFn: async () => (await api.get<WalletSummary>(ENDPOINTS.ESCROW_ACCOUNTS.LIST)).data,
    refetchInterval: 10000,
  });

  const vaultsQuery = useQuery({
    queryKey: ["client-project-vaults"],
    queryFn: async () =>
      (await api.get<{ items: Vault[] }>(ENDPOINTS.ESCROW_ACCOUNTS.PROJECT_VAULTS)).data.items,
    refetchInterval: 10000,
  });

  const transactionsQuery = useQuery({
    queryKey: ["client-wallet-transactions"],
    queryFn: async () =>
      (
        await api.get<{ items: WalletTransaction[] }>(
          ENDPOINTS.ESCROW_ACCOUNTS.TRANSACTIONS,
          { params: { limit: 5 } },
        )
      ).data.items,
    refetchInterval: 10000,
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const ready = await hasPasscode();
        if (!ready) router.push("/(client)/payments/passcode-setup" as never);
      })();
    }, []),
  );

  const wallet = walletQuery.data;
  const vaults = vaultsQuery.data || [];
  const recentTransactions = transactionsQuery.data || wallet?.recentTransactions || [];
  const walletBalance = Number(wallet?.availableBalance ?? wallet?.balance ?? 0);
  const totalProjectVaults = useMemo(
    () => vaults.reduce((sum, vault) => sum + Number(vault.currentBalance || 0), 0),
    [vaults],
  );
  const walletLimit = Number(wallet?.maxBalance || 100000);
  const walletPercent = walletLimit > 0 ? Math.min(100, Math.round((walletBalance / walletLimit) * 100)) : 0;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      walletQuery.refetch(),
      vaultsQuery.refetch(),
      transactionsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const unlockBalance = () => {
    if (balanceVisible) {
      setBalanceVisible(false);
      return;
    }
    if (isPasscodeSessionUnlocked()) {
      setBalanceVisible(true);
    } else {
      setPasscodeModal(true);
    }
  };

  const fundGeneralWallet = () => {
    router.push({ pathname: "/(client)/payments/deposit", params: { target: "general" } } as never);
  };

  const fundProjectWallet = (vault: Vault) => {
    router.push({
      pathname: "/(client)/payments/deposit",
      params: {
        target: "project",
        vaultId: vault.escrowAccountId,
        projectName: vault.projectName,
      },
    } as never);
  };

  const deleteVault = useMutation({
    mutationFn: async (vaultId: string) =>
      api.delete(ENDPOINTS.ESCROW_ACCOUNTS.DELETE_PROJECT_VAULT(vaultId)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["client-project-vaults"] }),
        queryClient.invalidateQueries({ queryKey: ["client-wallet-transactions"] }),
      ]);
      Alert.alert("Project wallet deleted", "Remaining balance was returned to your General Wallet.");
    },
    onError: (error: any) => {
      Alert.alert("Delete failed", error?.response?.data?.message || "Could not delete project wallet.");
    },
  });

  const confirmDeleteVault = (vault: Vault) => {
    Alert.alert(
      "Delete project wallet?",
      `This removes ${vault.projectName}'s project wallet and returns available balance to your General Wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteVault.mutate(vault.escrowAccountId),
        },
      ],
    );
  };

  if (walletQuery.isLoading || vaultsQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={COLORS.PRIMARY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[COLORS.PRIMARY]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "900" }}>
            CLIENT WALLET
          </Text>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 30, fontWeight: "900" }}>
            Payments
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 4 }}>
            Fund your General Wallet, then allocate money into project wallets.
          </Text>
        </View>

        <View style={{ backgroundColor: COLORS.INK, borderRadius: 8, padding: 20 }}>
          <View style={{ alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "900" }}>
                GENERAL WALLET
              </Text>
              <Text style={{ color: "#FFF", fontSize: 32, fontWeight: "900", marginTop: 5 }}>
                {balanceVisible ? formatRWF(walletBalance) : "••••••"}
              </Text>
              <Text style={{ color: "#CBD5E1", fontSize: 12, marginTop: 4 }}>
                Limit: {formatRWF(walletLimit)}
              </Text>
            </View>
            <Pressable
              onPress={unlockBalance}
              style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 8, padding: 10 }}
            >
              <Ionicons
                name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#FFF"
              />
            </Pressable>
          </View>

          <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 4, height: 7, marginTop: 18, overflow: "hidden" }}>
            <View style={{ backgroundColor: COLORS.PRIMARY, height: "100%", width: `${walletPercent}%` }} />
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "800" }}>
                PROJECT VAULTS
              </Text>
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 2 }}>
                {balanceVisible ? formatRWF(totalProjectVaults) : "••••••"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "800" }}>
                STATUS
              </Text>
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 2 }}>
                {wallet?.status || "active"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={fundGeneralWallet}
            style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 20, paddingVertical: 14 }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "900" }}>Fund General Wallet</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>
              Project Wallets
            </Text>
            <Pressable onPress={() => router.push("/(client)/create-project" as never)}>
              <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>New Project</Text>
            </Pressable>
          </View>

          {vaults.length === 0 ? (
            <View style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, padding: 24 }}>
              <Ionicons name="folder-open-outline" size={42} color={COLORS.TEXT_LIGHT} />
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 10 }}>
                No project wallet yet
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginTop: 4, textAlign: "center" }}>
                Create a project to get a dedicated project wallet.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {vaults.map((vault) => {
                const balance = Number(vault.currentBalance || 0);
                return (
                  <View
                    key={vault.escrowAccountId}
                    style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, padding: 16 }}
                  >
                    <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, height: 42, justifyContent: "center", width: 42 }}>
                        <Ionicons name="briefcase-outline" size={20} color={COLORS.PRIMARY} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "900" }}>
                          {vault.projectName}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 2 }}>
                          {vault.projectStatus} • {vault.currency}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 14 }}>
                      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
                        PROJECT WALLET BALANCE
                      </Text>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 24, fontWeight: "900", marginTop: 3 }}>
                        {balanceVisible ? formatRWF(balance) : "••••••"}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                      <Pressable
                        onPress={() => fundProjectWallet(vault)}
                        style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", paddingVertical: 12 }}
                      >
                        <Ionicons name="arrow-down-circle-outline" size={18} color="#FFF" />
                        <Text style={{ color: "#FFF", fontWeight: "900" }}>Transfer Funds</Text>
                      </Pressable>
                      <Pressable
                        disabled={deleteVault.isPending}
                        onPress={() => confirmDeleteVault(vault)}
                        style={{ alignItems: "center", borderColor: COLORS.ERROR, borderRadius: 8, borderWidth: 1, justifyContent: "center", opacity: deleteVault.isPending ? 0.5 : 1, paddingHorizontal: 13 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.ERROR} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ marginTop: 22 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Recent Wallet Activity
          </Text>
          <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, padding: 14 }}>
            {recentTransactions.length === 0 ? (
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>No wallet transactions yet.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {recentTransactions.map((tx) => (
                  <View key={tx.id} style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
                    <Ionicons
                      name={Number(tx.amount) >= 0 ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
                      size={20}
                      color={Number(tx.amount) >= 0 ? COLORS.SUCCESS : COLORS.ERROR}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "800" }}>{tx.type.replace(/_/g, " ")}</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11 }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}
                      </Text>
                    </View>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                      {balanceVisible ? formatRWF(Math.abs(Number(tx.amount || 0))) : "••••"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <VerifyPasscodeModal
        actionType="unlock_balance"
        onClose={() => setPasscodeModal(false)}
        onSuccess={() => {
          setBalanceVisible(true);
          setPasscodeModal(false);
        }}
        visible={passcodeModal}
      />
    </SafeAreaView>
  );
}
