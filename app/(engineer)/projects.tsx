import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerProject } from "@/components/engineer/engineer-types";

export default function EngineerProjects() {
  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => {
      const response = await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST);
      return response.data.filter((project) =>
        project.engineerId ||
        (project.projectMembers || []).some(
          (member) =>
            member.role?.toLowerCase() === "engineer" &&
            member.status?.toLowerCase() === "accepted",
        ),
      );
    },
    refetchOnMount: "always",
  });

  const projects = projectsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>Engineer projects</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Accepted projects are ready for milestone planning, BOQ, RFQs, and progress uploads.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty />
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectCard({ project }: { project: EngineerProject }) {
  const milestones = project.milestones || [];
  const supervisor = (project.projectMembers || []).find(
    (member) => member.role?.toLowerCase() === "supervisor" && member.status?.toLowerCase() === "accepted",
  );

  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 10, height: 48, justifyContent: "center", width: 48 }}>
          <Ionicons name="business-outline" size={24} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{project.name}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            {project.address || project.description || "Assigned construction project"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Mini label="Status" value={project.status} />
        <Mini label="Milestones" value={milestones.length} />
        <Mini label="Supervisor" value={supervisor?.user?.name || (supervisor ? "Accepted" : "Pending")} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <ActionButton icon="flag-outline" label="Stages" route="/(engineer)/milestones" projectId={project.id} />
        <ActionButton icon="list-outline" label="BOQ" route="/(engineer)/boq" projectId={project.id} />
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <ActionButton icon="receipt-outline" label="RFQs" route="/(engineer)/rfqs" projectId={project.id} />
        <ActionButton icon="camera-outline" label="Progress" route="/(engineer)/progress" projectId={project.id} />
      </View>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, padding: 10 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 12, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  route,
  projectId,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: "/(engineer)/milestones" | "/(engineer)/boq" | "/(engineer)/rfqs" | "/(engineer)/progress";
  projectId: string;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: route, params: { projectId } })}
      style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 12 }}
    >
      <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function Empty() {
  return (
    <View style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 28 }}>
      <Ionicons name="business-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>No accepted projects</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6, textAlign: "center" }}>
        Accept a client invitation first, then the project appears here.
      </Text>
    </View>
  );
}
