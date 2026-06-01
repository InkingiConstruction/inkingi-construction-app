import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EngineerProjects() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>
          Engineer projects
        </Text>
        <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>
          Open an accepted project before creating milestones or BOQ.
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
          <Text style={{ color: "#334155", fontSize: 14 }}>Use GET /api/v1/projects filtered by the authenticated engineer.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
