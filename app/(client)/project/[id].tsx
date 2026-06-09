import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientProject } from "@/components/client/client-types";
import { ProjectFeed } from "@/components/shared/project-feed";
import { COLORS } from "@/constants/colors";

export default function ClientProjectDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectId = String(id || "");

  const projectQuery = useQuery({
    queryKey: ["client-project", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<ClientProject>(ENDPOINTS.PROJECTS.DETAIL(projectId))).data,
  });

  const project = projectQuery.data;
  const milestones = project?.milestones || [];
  const paidMilestones = milestones.filter((milestone) => milestone.status === "paid").length;
  const progressPct = milestones.length ? Math.round((paidMilestones / milestones.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={projectQuery.isRefetching}
            onRefresh={projectQuery.refetch}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CLIENT PROJECT</Text>
            <Text numberOfLines={1} style={styles.title}>{project?.name || "Project"}</Text>
          </View>
        </View>

        {projectQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : !project ? (
          <Text style={styles.body}>Project not found.</Text>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>WORKSPACE</Text>
                <Text style={styles.heroTitle}>{project.name}</Text>
                <Text style={styles.heroBody}>{project.address || project.description || "Project workspace"}</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="business-outline" size={28} color={COLORS.TEXT_WHITE} />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Info label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency || "RWF"}`} />
              <Info label="Status" value={project.status} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Info label="Engineer" value={project.engineer?.name || "Not assigned"} />
              <Info label="Milestones" value={`${paidMilestones}/${milestones.length} paid`} />
            </View>

            <View style={styles.progressCard}>
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.sectionTitle}>Payment progress</Text>
                <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>{progressPct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.body}>Client payment releases happen after supervisor approval.</Text>
            </View>

            <ProjectFeed projectId={project.id} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = {
  backButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center" as const,
    width: 42,
  },
  eyebrow: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 25,
    fontWeight: "900" as const,
  },
  hero: {
    alignItems: "center" as const,
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    flexDirection: "row" as const,
    gap: 12,
    padding: 18,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "900" as const,
  },
  heroTitle: {
    color: COLORS.TEXT_WHITE,
    fontSize: 24,
    fontWeight: "900" as const,
    marginTop: 5,
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  heroIcon: {
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    height: 58,
    justifyContent: "center" as const,
    width: 58,
  },
  info: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 13,
  },
  infoLabel: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 10,
    fontWeight: "900" as const,
  },
  infoValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 15,
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: "900" as const,
  },
  body: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
  },
  track: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 999,
    height: 8,
    overflow: "hidden" as const,
  },
  fill: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 999,
    height: "100%" as const,
  },
};
