import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupplierQuotes() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>
          My quotes
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>
          Track submitted quotes and selection status.
        </Text>
        <View style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, borderWidth: 1, padding: 16 }}>
          <Text style={{ color: "#334155", fontSize: 14 }}>
            Use GET /api/v1/quotes and PUT /api/v1/quotes/:id.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
