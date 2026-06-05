import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type FundingMethod = "mtn_momo" | "airtel_money" | "bank_transfer" | "stripe";

const METHODS: {
  id: FundingMethod;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresPhone?: boolean;
}[] = [
  {
    id: "mtn_momo",
    title: "MTN Mobile Money",
    subtitle: "Fund from your MTN wallet",
    icon: "phone-portrait-outline",
    requiresPhone: true,
  },
  {
    id: "airtel_money",
    title: "Airtel Money",
    subtitle: "Fund from Airtel Money",
    icon: "phone-portrait-outline",
    requiresPhone: true,
  },
  {
    id: "stripe",
    title: "Card / Stripe",
    subtitle: "Create card funding request",
    icon: "card-outline",
  },
  {
    id: "bank_transfer",
    title: "Bank Transfer",
    subtitle: "Create manual bank transfer request",
    icon: "business-outline",
  },
];

type FundingResponse = {
  fundingRequest: {
    id: string;
    amount: string | number;
    method: FundingMethod;
    status: string;
  };
};

export default function DepositScreen() {
  const params = useLocalSearchParams<{
    target?: "general" | "project";
    vaultId?: string;
    projectName?: string;
  }>();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [method, setMethod] = useState<FundingMethod>("mtn_momo");
  const [autoConfirm, setAutoConfirm] = useState(true);

  const isProjectTransfer = params.target === "project" && Boolean(params.vaultId);
  const selectedMethod = METHODS.find((item) => item.id === method) || METHODS[0];

  const fundWallet = useMutation({
    mutationFn: async () => {
      const amountNumber = Number(amount);
      const funding = await api.post<FundingResponse>(ENDPOINTS.ESCROW_ACCOUNTS.FUND, {
        amount: amountNumber,
        method,
        phoneNumber: selectedMethod.requiresPhone ? phoneNumber : undefined,
      });

      if (autoConfirm) {
        await api.post(ENDPOINTS.ESCROW_ACCOUNTS.CONFIRM_FUNDING(funding.data.fundingRequest.id));
      }

      if (isProjectTransfer && params.vaultId) {
        await api.post(ENDPOINTS.ESCROW_ACCOUNTS.TRANSFER_TO_VAULT, {
          escrowAccountId: params.vaultId,
          amount: amountNumber,
          description: `Project funding for ${params.projectName || "project"}`,
        });
      }

      return funding.data.fundingRequest;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["client-project-vaults"] }),
        queryClient.invalidateQueries({ queryKey: ["client-wallet-transactions"] }),
      ]);
      Alert.alert(
        isProjectTransfer ? "Project wallet funded" : "Wallet funded",
        autoConfirm
          ? "Funding was confirmed and balances were updated."
          : "Funding request was created. Balance will update after webhook confirmation.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
    onError: (error: any) => {
      Alert.alert("Funding failed", error?.response?.data?.message || "Please try again.");
    },
  });

  const submit = () => {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      Alert.alert("Invalid amount", "Enter a valid amount.");
      return;
    }
    if (selectedMethod.requiresPhone && !phoneNumber.trim()) {
      Alert.alert("Phone required", "Enter the mobile money phone number.");
      return;
    }
    fundWallet.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>

          <Text style={styles.title}>{isProjectTransfer ? "Fund Project Wallet" : "Fund General Wallet"}</Text>
          <Text style={styles.subtitle}>
            {isProjectTransfer
              ? `Funds go into your General Wallet first, then transfer to ${params.projectName || "this project"}.`
              : "Add funds to your General Wallet for future project transfers."}
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Amount (RWF)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={styles.amountInput}
              value={amount}
            />
          </View>

          <View style={{ gap: 10, marginTop: 16 }}>
            <Text style={styles.label}>Payment method</Text>
            {METHODS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setMethod(item.id)}
                style={[styles.methodCard, method === item.id && styles.methodCardActive]}
              >
                <View style={styles.methodIcon}>
                  <Ionicons name={item.icon} size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{item.title}</Text>
                  <Text style={styles.methodSubtitle}>{item.subtitle}</Text>
                </View>
                {method === item.id ? (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.PRIMARY} />
                ) : null}
              </Pressable>
            ))}
          </View>

          {selectedMethod.requiresPhone ? (
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                placeholder="+250788123456"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                style={styles.input}
                value={phoneNumber}
              />
            </View>
          ) : null}

          <Pressable
            onPress={() => setAutoConfirm((value) => !value)}
            style={styles.confirmToggle}
          >
            <Ionicons
              name={autoConfirm ? "checkbox-outline" : "square-outline"}
              size={22}
              color={COLORS.PRIMARY}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Confirm immediately for testing</Text>
              <Text style={styles.methodSubtitle}>
                Turn off when real provider webhooks are active.
              </Text>
            </View>
          </Pressable>

          <Pressable
            disabled={fundWallet.isPending}
            onPress={submit}
            style={[styles.submitButton, fundWallet.isPending && { opacity: 0.65 }]}
          >
            {fundWallet.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={20} color="#FFF" />
                <Text style={styles.submitText}>
                  {isProjectTransfer ? "Fund Project Wallet" : "Fund General Wallet"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  label: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  amountInput: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: "900",
    paddingVertical: 8,
  },
  input: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    color: COLORS.TEXT_PRIMARY,
    padding: 13,
  },
  methodCard: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  methodCardActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  methodIcon: {
    alignItems: "center",
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  methodTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "900",
  },
  methodSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  confirmToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 16,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
