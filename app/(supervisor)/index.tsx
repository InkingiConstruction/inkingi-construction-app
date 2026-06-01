import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupervisorIndex() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>Supervisor dashboard</Text>
          <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>Inspect milestones and approve or reject engineer progress.</Text>
        </View>
        <View style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 }}>
          <Text style={{ color: "#334155", fontSize: 14 }}>Supervisor workflow</Text>
          <Link href="/(supervisor)/projects" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Assigned projects</Text>
          </Link>
          <Link href="/(supervisor)/inspections" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Inspections</Text>
          </Link>
          <Link href="/(supervisor)/progress-review" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Progress review</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
