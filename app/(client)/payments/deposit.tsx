import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
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
import {
  authenticateWithBiometrics,
  hasPasscode,
} from "@/utils/SecurityUtils";
import VerifyPasscodeModal from "./verify-passcode";

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
  paymentIntent?: {
    id: string;
    clientSecret: string | null;
  };
};

export default function DepositScreen() {
  const params = useLocalSearchParams<{
    target?: "general" | "project";
    vaultId?: string;
    projectName?: string;
  }>();
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [method, setMethod] = useState<FundingMethod>("mtn_momo");
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [passcodeModal, setPasscodeModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | undefined>();

  const isProjectTransfer = params.target === "project" && Boolean(params.vaultId);
  const selectedMethod = METHODS.find((item) => item.id === method) || METHODS[0];
  const amountFontSize = amount.length > 12 ? 22 : amount.length > 9 ? 25 : 28;

  const fundWallet = useMutation({
    mutationFn: async () => {
      const amountNumber = Number(amount);
      if (isProjectTransfer && params.vaultId) {
        await api.post(ENDPOINTS.ESCROW_ACCOUNTS.TRANSFER_TO_VAULT, {
          escrowAccountId: params.vaultId,
          amount: amountNumber,
          description: `Project funding for ${params.projectName || "project"}`,
        });
        return {
          id: params.vaultId,
          amount: amountNumber,
          method: "bank_transfer" as FundingMethod,
          status: "completed",
        };
      }

      const funding = await api.post<FundingResponse>(ENDPOINTS.ESCROW_ACCOUNTS.FUND, {
        amount: amountNumber,
        method,
        phoneNumber: selectedMethod.requiresPhone ? phoneNumber : undefined,
      });

      if (method === "stripe") {
        const clientSecret = funding.data.paymentIntent?.clientSecret;
        if (!clientSecret) {
          throw new Error("Stripe payment could not be initialized.");
        }

        const initResult = await initPaymentSheet({
          merchantDisplayName: "Inkingi Construction",
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: false,
          defaultBillingDetails: {
            address: { country: "RW" },
          },
        });

        if (initResult.error) {
          throw new Error(initResult.error.message);
        }

        const presentResult = await presentPaymentSheet();
        if (presentResult.error) {
          throw new Error(presentResult.error.message);
        }

        await api.post(ENDPOINTS.ESCROW_ACCOUNTS.CONFIRM_FUNDING(funding.data.fundingRequest.id));
      } else if (autoConfirm) {
        await api.post(ENDPOINTS.ESCROW_ACCOUNTS.CONFIRM_FUNDING(funding.data.fundingRequest.id));
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
        isProjectTransfer || method === "stripe" || autoConfirm
          ? "Funding was confirmed and balances were updated."
          : "Funding request was created. Balance will update after provider confirmation.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
    onError: (error: any) => {
      Alert.alert("Funding failed", error?.message || "Please try again.");
    },
  });

  const startFunding = () => fundWallet.mutate();

  const authorizeFunding = async (amountNumber: number) => {
    const ready = await hasPasscode();
    if (!ready) {
      router.push("/(client)/payments/passcode-setup" as never);
      return;
    }

    const biometricOk = await authenticateWithBiometrics(
      isProjectTransfer ? "Authorize project wallet transfer" : "Authorize wallet funding",
    );
    if (biometricOk) {
      startFunding();
      return;
    }

    setPendingAmount(amountNumber);
    setPasscodeModal(true);
  };

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
    authorizeFunding(amountNumber);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>

          <Text style={styles.title}>{isProjectTransfer ? "Transfer to Project Wallet" : "Fund General Wallet"}</Text>
          <Text style={styles.subtitle}>
            {isProjectTransfer
              ? `This deducts from your General Wallet and moves money to ${params.projectName || "this project"}.`
              : "Add funds to your General Wallet for future project transfers."}
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Amount (RWF)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              numberOfLines={1}
              style={[styles.amountInput, { fontSize: amountFontSize }]}
              value={amount}
            />
          </View>

          {!isProjectTransfer ? (
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
          ) : null}

          {!isProjectTransfer && selectedMethod.requiresPhone ? (
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

          {!isProjectTransfer && method !== "stripe" ? (
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
          ) : null}

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
                  {isProjectTransfer ? "Transfer to Project Wallet" : "Fund General Wallet"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <VerifyPasscodeModal
        actionType="deposit"
        amount={pendingAmount}
        onClose={() => setPasscodeModal(false)}
        onSuccess={() => {
          setPasscodeModal(false);
          startFunding();
        }}
        visible={passcodeModal}
      />
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
    width: "100%",
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
