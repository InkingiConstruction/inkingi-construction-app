import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import {
  SupplierDelivery,
  SupplierPurchaseOrder,
  SupplierQuote,
  SupplierRfq,
} from "@/components/supplier/supplier-types";

export default function SupplierIndex() {
  const rfqsQuery = useQuery({
    queryKey: ["supplier-rfqs"],
    queryFn: async () => (await api.get<SupplierRfq[]>(ENDPOINTS.RFQS.LIST)).data,
  });
  const quotesQuery = useQuery({
    queryKey: ["supplier-quotes"],
    queryFn: async () => (await api.get<SupplierQuote[]>(ENDPOINTS.QUOTES.LIST)).data,
  });
  const ordersQuery = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: async () => (await api.get<SupplierPurchaseOrder[]>(ENDPOINTS.PURCHASE_ORDERS.LIST)).data,
  });
  const deliveriesQuery = useQuery({
    queryKey: ["supplier-deliveries"],
    queryFn: async () => (await api.get<SupplierDelivery[]>(ENDPOINTS.DELIVERIES.LIST)).data,
  });

  const rfqs = rfqsQuery.data || [];
  const quotes = quotesQuery.data || [];
  const orders = ordersQuery.data || [];
  const deliveries = deliveriesQuery.data || [];
  const issuedOrders = orders.filter((order) => order.status === "issued");
  const loading = rfqsQuery.isLoading || quotesQuery.isLoading || ordersQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <SupplierTopBar
          title="Dashboard"
          subtitle="Procurement workbench for quotes, orders, and deliveries."
        />
        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, padding: 18 }}>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "800", opacity: 0.75 }}>
                Next supplier action
              </Text>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 24, fontWeight: "900", marginTop: 8 }}>
                {issuedOrders[0]?.poNumber || rfqs[0]?.title || "No action pending"}
              </Text>
              <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                {issuedOrders[0]
                  ? "Accept this purchase order to start delivery."
                  : rfqs[0]
                    ? "Submit a competitive quote for this open RFQ."
                    : "New RFQs and orders will appear here."}
              </Text>
              <Pressable
                onPress={() => router.push(issuedOrders[0] ? "/(supplier)/purchase-orders" : "/(supplier)/rfqs")}
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 8,
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 16,
                  paddingVertical: 13,
                }}
              >
                <Ionicons name="arrow-forward" size={18} color={COLORS.TEXT_WHITE} />
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Open workflow</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric label="Open RFQs" value={rfqs.length} icon="receipt-outline" />
              <Metric label="Quotes" value={quotes.length} icon="document-text-outline" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric label="Orders" value={orders.length} icon="cart-outline" />
              <Metric label="Deliveries" value={deliveries.length} icon="cube-outline" />
            </View>

            <Section title="Recent RFQs" action="View all" onPress={() => router.push("/(supplier)/rfqs")}>
              {rfqs.slice(0, 3).map((rfq) => (
                <Row
                  key={rfq.id}
                  title={rfq.title}
                  subtitle={`${rfq.quantity} ${rfq.unit} • ${rfq.project?.name || "Project"}`}
                  status={rfq.status}
                  onPress={() => router.push("/(supplier)/rfqs")}
                />
              ))}
              {rfqs.length === 0 ? <EmptyLine text="No open RFQs available." /> : null}
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flex: 1, padding: 16 }}>
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900", marginTop: 10 }}>{value}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

function Section({ title, action, children, onPress }: { title: string; action: string; children: React.ReactNode; onPress: () => void }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
        <Pressable onPress={onPress}><Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>{action}</Text></Pressable>
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Row({ title, subtitle, status, onPress }: { title: string; subtitle: string; status: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, padding: 13 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
      <Text style={{ color: COLORS.PRIMARY, fontSize: 11, fontWeight: "900", marginTop: 6 }}>{status}</Text>
    </Pressable>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>;
}
