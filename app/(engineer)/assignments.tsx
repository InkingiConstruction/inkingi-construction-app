import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EngineerAssignments() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>
          Project assignments
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>
          Accept or reject projects assigned by clients.
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
          <Text style={{ color: "#334155", fontSize: 14 }}>Use GET /api/v1/project-members and POST /api/v1/project-members/:id/accept or reject.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
