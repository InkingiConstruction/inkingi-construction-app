import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EngineerIndex() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 20 }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#0f172a", fontSize: 26, fontWeight: "800" }}>Engineer dashboard</Text>
          <Text style={{ color: "#64748b", fontSize: 14, lineHeight: 20 }}>Accept projects, create milestones, prepare BOQ, publish RFQs, and upload progress.</Text>
        </View>
        <View style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 }}>
          <Text style={{ color: "#334155", fontSize: 14 }}>Engineer workflow</Text>
          <Link href="/(engineer)/assignments" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Assignments</Text>
          </Link>
          <Link href="/(engineer)/projects" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Projects</Text>
          </Link>
          <Link href="/(engineer)/milestones" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Milestones</Text>
          </Link>
          <Link href="/(engineer)/boq" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>BOQ</Text>
          </Link>
          <Link href="/(engineer)/rfqs" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>RFQs</Text>
          </Link>
          <Link href="/(engineer)/progress" asChild>
            <Text style={{ color: "#059669", fontWeight: "700" }}>Progress upload</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
