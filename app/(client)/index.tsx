import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClientIndex() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>Client dashboard</Text>
          <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>Create projects, assign teams, track progress, and pay milestones.</Text>
        </View>
        <View style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 }}>
          <Text style={{ color: "#334155", fontSize: 14 }}>Client workflow</Text>
          <Link href="/(client)/create-project" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Create project</Text>
          </Link>
          <Link href="/(client)/projects" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>My projects</Text>
          </Link>
          <Link href="/(client)/assign-engineer" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Assign engineer</Text>
          </Link>
          <Link href="/(client)/assign-supervisor" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Assign supervisor</Text>
          </Link>
          <Link href="/(client)/payments" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Payments</Text>
          </Link>
          <Link href="/(client)/progress" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Progress</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
