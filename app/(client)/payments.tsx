import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClientPayments() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>
          Payments
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>
          Deposit escrow and release milestone payments after approvals.
        </Text>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            borderRadius: 12,
            borderWidth: 1,
            padding: 16,
          }}
        >
          <Text style={{ color: "#334155", fontSize: 14 }}>Use /api/v1/transactions and /api/v1/escrow-accounts payment endpoints.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
