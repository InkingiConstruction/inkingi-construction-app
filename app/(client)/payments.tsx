import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientEscrowAccount, ClientMilestone, ClientTransaction } from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function ClientPayments() {
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [escrowId, setEscrowId] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const escrowQuery = useQuery({
    queryKey: ["client-escrow-accounts"],
    queryFn: async () => (await api.get<ClientEscrowAccount[]>(ENDPOINTS.ESCROW_ACCOUNTS.LIST)).data,
  });
  const transactionsQuery = useQuery({
    queryKey: ["client-transactions"],
    queryFn: async () => (await api.get<ClientTransaction[]>(ENDPOINTS.TRANSACTIONS.LIST)).data,
  });
  const milestonesQuery = useQuery({
    queryKey: ["client-milestones"],
    queryFn: async () => (await api.get<ClientMilestone[]>(ENDPOINTS.MILESTONES.LIST)).data,
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!escrowId || !amount.trim() || !phoneNumber.trim()) {
        throw new Error("Choose an escrow account, amount, and phone number.");
      }
      return api.post(ENDPOINTS.ESCROW_ACCOUNTS.DEPOSIT_MTN(escrowId), {
        amount: Number(amount),
        phoneNumber: phoneNumber.trim(),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-escrow-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
      ]);
      Alert.alert("Deposit started", "MTN MoMo payment prompt has been requested.");
    },
    onError: (error) => Alert.alert("Deposit failed", error instanceof Error ? error.message : "Try again."),
  });

  const stripeDepositMutation = useMutation({
    mutationFn: async () => {
      if (!escrowId || !amount.trim()) {
        throw new Error("Choose an escrow account and amount.");
      }

      if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key is not configured for this build.");
      }

      const selectedEscrow = escrows.find((item) => item.id === escrowId);
      const response = await api.post<{
        data: {
          clientSecret: string;
          paymentIntentId: string;
        };
      }>(ENDPOINTS.ESCROW_ACCOUNTS.DEPOSIT_STRIPE(escrowId), {
        amount: Number(amount),
        currency: selectedEscrow?.currency || selectedEscrow?.project?.currency || "rwf",
      });

      const clientSecret = response.data.data.clientSecret;

      if (!clientSecret) {
        throw new Error("Stripe did not return a payment secret.");
      }

      const initResult = await initPaymentSheet({
        merchantDisplayName: "Inkingi Construction",
        paymentIntentClientSecret: clientSecret,
        returnURL: "inkingi://stripe-redirect",
      });

      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      const paymentResult = await presentPaymentSheet();

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      return response.data.data;
    },
    onSuccess: async () => {
      setAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-escrow-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
      ]);
      Alert.alert("Payment completed", "Your Stripe card payment was completed.");
    },
    onError: (error) => Alert.alert("Stripe payment failed", error instanceof Error ? error.message : "Try again."),
  });

  const releaseMutation = useMutation({
    mutationFn: async (milestone: ClientMilestone) => {
      const escrow = escrows.find((item) => item.projectId === milestone.projectId);
      if (!escrow) throw new Error("Escrow account not found for this milestone.");
      return api.post(ENDPOINTS.TRANSACTIONS.CREATE, {
        escrowAccountId: escrow.id,
        milestoneId: milestone.id,
        type: "release",
        method: "bank_transfer",
        amount: Number(escrow.project?.budget || 0) * (Number(milestone.budgetPercentage || 0) / 100),
        status: "completed",
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["client-milestones"] }),
        queryClient.invalidateQueries({ queryKey: ["client-escrow-accounts"] }),
      ]);
      Alert.alert("Payment released", "Milestone payment has been recorded.");
    },
    onError: (error) => Alert.alert("Release failed", error instanceof Error ? error.message : "Try again."),
  });

  const escrows = escrowQuery.data || [];
  const transactions = transactionsQuery.data || [];
  const payableMilestones = (milestonesQuery.data || []).filter((milestone) => milestone.status === "awaiting_client_payment");
  const totalBalance = escrows.reduce((sum, escrow) => sum + Number(escrow.balance || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Payments"
          subtitle="Fund escrow, review balances, and release approved milestone payments."
        />

        {escrowQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, padding: 18 }}>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900", opacity: 0.75 }}>
                AVAILABLE ESCROW
              </Text>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 28, fontWeight: "900", marginTop: 8 }}>
                {totalBalance.toLocaleString()} RWF
              </Text>
              <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                Deposits and releases are tracked by project escrow account.
              </Text>
            </View>

            <Panel title="Fund escrow">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {escrows.map((escrow) => (
                  <Pressable
                    key={escrow.id}
                    onPress={() => setEscrowId(escrow.id)}
                    style={{
                      backgroundColor: escrowId === escrow.id ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
                      borderColor: escrowId === escrow.id ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                      borderRadius: 8,
                      borderWidth: 1,
                      padding: 12,
                      width: 210,
                    }}
                  >
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }} numberOfLines={1}>
                      {escrow.project?.name || "Project escrow"}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 5 }}>
                      {Number(escrow.balance || 0).toLocaleString()} {escrow.currency}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="500000" keyboardType="numeric" />
              <Button
                icon="card-outline"
                label={stripeDepositMutation.isPending ? "Opening Stripe..." : "Pay with card"}
                loading={stripeDepositMutation.isPending}
                onPress={() => stripeDepositMutation.mutate()}
              />
              <View style={{ borderColor: COLORS.BORDER_LIGHT, borderTopWidth: 1, marginTop: 2, paddingTop: 12 }}>
                <Field label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+250788000000" keyboardType="phone-pad" />
                <Button
                  icon="phone-portrait-outline"
                  label={depositMutation.isPending ? "Requesting prompt..." : "Request MoMo deposit"}
                  loading={depositMutation.isPending}
                  onPress={() => depositMutation.mutate()}
                />
              </View>
            </Panel>

            <Panel title="Milestones awaiting release">
              {payableMilestones.map((milestone) => (
                <View key={milestone.id} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, padding: 13 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{milestone.name}</Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                    {Number(milestone.budgetPercentage || 0)}% of project budget
                  </Text>
                  <Pressable
                    disabled={releaseMutation.isPending}
                    onPress={() => releaseMutation.mutate(milestone)}
                    style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, marginTop: 10, paddingVertical: 10 }}
                  >
                    <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Release payment</Text>
                  </Pressable>
                </View>
              ))}
              {payableMilestones.length === 0 ? <Empty text="No milestone is waiting for client payment right now." /> : null}
            </Panel>

            <Panel title="Recent transactions">
              {transactions.slice(0, 6).map((transaction) => (
                <View key={transaction.id} style={{ borderColor: COLORS.BORDER_LIGHT, borderBottomWidth: 1, paddingBottom: 11 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                    {transaction.type} • {Number(transaction.amount || 0).toLocaleString()}
                  </Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                    {transaction.status} {transaction.method ? `• ${transaction.method}` : ""}
                  </Text>
                </View>
              ))}
              {transactions.length === 0 ? <Empty text="Transactions will appear after deposits or releases." /> : null}
            </Panel>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, gap: 12, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "900" }}>{props.label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{
          backgroundColor: COLORS.MUTED,
          borderColor: COLORS.BORDER_LIGHT,
          borderRadius: 8,
          borderWidth: 1,
          color: COLORS.TEXT_PRIMARY,
          minHeight: 48,
          paddingHorizontal: 13,
        }}
      />
    </View>
  );
}

function Button({ icon, label, loading, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; loading: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={{ alignItems: "center", backgroundColor: loading ? COLORS.TEXT_LIGHT : COLORS.PRIMARY, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 13 }}
    >
      {loading ? <ActivityIndicator color={COLORS.TEXT_WHITE} /> : <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />}
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>;
}
