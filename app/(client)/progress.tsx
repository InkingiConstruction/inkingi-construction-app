import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientInspection, ClientMilestone, ClientProgressPhoto } from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function ClientProgress() {
  const progressQuery = useQuery({
    queryKey: ["client-progress-photos"],
    queryFn: async () => (await api.get<ClientProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST)).data,
  });
  const milestonesQuery = useQuery({
    queryKey: ["client-milestones"],
    queryFn: async () => (await api.get<ClientMilestone[]>(ENDPOINTS.MILESTONES.LIST)).data,
  });
  const inspectionsQuery = useQuery({
    queryKey: ["client-inspections"],
    queryFn: async () => (await api.get<ClientInspection[]>(ENDPOINTS.INSPECTIONS.LIST)).data,
  });

  const progress = progressQuery.data || [];
  const milestones = milestonesQuery.data || [];
  const inspections = inspectionsQuery.data || [];
  const approved = inspections.filter((inspection) => inspection.decision === "approved").length;
  const rejected = inspections.filter((inspection) => inspection.decision === "rejected").length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Progress"
          subtitle="Follow engineer uploads, milestone state, and supervisor inspection decisions."
        />

        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Metric label="Milestones" value={milestones.length} icon="flag-outline" />
            <Metric label="Photos" value={progress.length} icon="images-outline" />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Metric label="Approved" value={approved} icon="checkmark-circle-outline" />
            <Metric label="Rejected" value={rejected} icon="close-circle-outline" />
          </View>

          <Panel title="Milestone timeline">
            {milestones.map((milestone) => (
              <View key={milestone.id} style={{ borderColor: COLORS.BORDER_LIGHT, borderBottomWidth: 1, paddingBottom: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{milestone.name}</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  {milestone.description || "No milestone description"} 
                </Text>
                <Text style={{ color: COLORS.PRIMARY, fontSize: 11, fontWeight: "900", marginTop: 6 }}>
                  {milestone.status}
                </Text>
              </View>
            ))}
            {milestones.length === 0 ? <Empty text="No milestones have been created for your projects yet." /> : null}
          </Panel>

          <Panel title="Recent progress uploads">
            {progress.map((photo) => (
              <View key={photo.id} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, overflow: "hidden" }}>
                <Image source={{ uri: photo.cloudinaryUrl }} style={{ height: 170, width: "100%" }} />
                <View style={{ padding: 12 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                    {photo.milestone?.name || photo.project?.name || "Progress update"}
                  </Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                    {photo.caption || "Engineer uploaded a progress photo."}
                  </Text>
                </View>
              </View>
            ))}
            {progress.length === 0 ? <Empty text="Progress photos will appear after the engineer uploads site updates." /> : null}
          </Panel>
        </View>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, gap: 12, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>;
}
