import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupplierIndex() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>
            Supplier dashboard
          </Text>
          <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>
            View RFQs, submit quotes, accept purchase orders, and manage deliveries.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderRadius: 12,
            borderWidth: 1,
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ color: "#334155", fontSize: 14 }}>Supplier workflow</Text>
          <Link href="/(supplier)/rfqs" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Available RFQs</Text>
          </Link>
          <Link href="/(supplier)/quotes" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>My quotes</Text>
          </Link>
          <Link href="/(supplier)/purchase-orders" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Purchase orders</Text>
          </Link>
          <Link href="/(supplier)/deliveries" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Deliveries</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
