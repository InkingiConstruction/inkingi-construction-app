import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { EngineerBoqItem, EngineerMilestone, EngineerProgressPhoto, EngineerProject, EngineerRfq } from "@/components/engineer/engineer-types";
import { money } from "@/components/engineer/engineer-utils";
import { COLORS } from "@/constants/colors";

export default function EngineerProjectDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectId = String(id || "");

  const projectQuery = useQuery({
    queryKey: ["engineer-project", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<EngineerProject>(ENDPOINTS.PROJECTS.DETAIL(projectId))).data,
  });

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId } })).data,
  });

  const boqQuery = useQuery({
    queryKey: ["engineer-boq-items", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<EngineerBoqItem[]>(ENDPOINTS.BOQ_ITEMS.LIST, { params: { projectId } })).data,
  });

  const rfqsQuery = useQuery({
    queryKey: ["engineer-rfqs", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<EngineerRfq[]>(ENDPOINTS.RFQS.LIST, { params: { projectId } })).data,
  });

  const progressQuery = useQuery({
    queryKey: ["engineer-progress", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, { params: { projectId } })).data,
  });

  const project = projectQuery.data;
  const milestones = milestonesQuery.data || [];
  const boqItems = boqQuery.data || [];
  const rfqs = rfqsQuery.data || [];
  const progress = progressQuery.data || [];
  const paidMilestones = milestones.filter((milestone) => milestone.status === "paid").length;
  const progressPct = milestones.length ? Math.round((paidMilestones / milestones.length) * 100) : 0;
  const pendingReview = milestones.filter((milestone) => milestone.status === "pending_supervisor").length;
  const revisionRequired = milestones.filter((milestone) => milestone.status === "revision_required").length;
  const supervisor = project?.projectMembers?.find(
    (member) => member.role?.toLowerCase() === "supervisor" && member.status?.toLowerCase() === "accepted",
  );

  const loading = projectQuery.isLoading || milestonesQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>PROJECT WORKSPACE</Text>
            <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 25, fontWeight: "900" }}>
              {project?.name || "Project"}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
        ) : !project ? (
          <Empty text="Project not found or you do not have access." />
        ) : (
          <>
            <View style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>ENGINEERING DELIVERY</Text>
                <Text style={styles.heroTitle}>{project.name}</Text>
                <Text style={styles.heroBody}>
                  {project.address || project.description || "Assigned construction project"}
                </Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="construct-outline" size={28} color={COLORS.TEXT_WHITE} />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat label="Budget" value={money(project.budget, project.currency || "RWF")} />
              <Stat label="Status" value={project.status} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat label="Client" value={project.client?.name || "Client"} />
              <Stat label="Supervisor" value={supervisor?.user?.name || (supervisor ? "Accepted" : "Pending")} />
            </View>

            <View style={styles.progressCard}>
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>Delivery progress</Text>
                <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>{progressPct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                {paidMilestones}/{milestones.length} milestones paid. {pendingReview} waiting for supervisor review.
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Metric icon="flag-outline" label="Milestones" value={milestones.length} route="/(engineer)/milestones" projectId={project.id} />
              <Metric icon="list-outline" label="BOQ items" value={boqItems.length} route="/(engineer)/boq" projectId={project.id} />
              <Metric icon="receipt-outline" label="RFQs" value={rfqs.length} route="/(engineer)/rfqs" projectId={project.id} />
              <Metric icon="camera-outline" label="Progress" value={progress.length} route="/(engineer)/progress" projectId={project.id} />
            </View>

            {revisionRequired > 0 ? (
              <Info
                icon="alert-circle-outline"
                title={`${revisionRequired} milestone${revisionRequired === 1 ? "" : "s"} need revision`}
                body="Open milestones and resend the package after updating the requested details."
              />
            ) : null}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Action label="Open chat" icon="chatbubbles-outline" route="/(engineer)/messages" />
              <Action label="All projects" icon="business-outline" route="/(engineer)/projects" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label.toUpperCase()}</Text>
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "900", marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  route,
  projectId,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  route: "/(engineer)/milestones" | "/(engineer)/boq" | "/(engineer)/rfqs" | "/(engineer)/progress";
  projectId: string;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: route, params: { projectId } } as never)}
      style={styles.metric}
    >
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={18} color={COLORS.PRIMARY} />
      </View>
      <View>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{value}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 10, fontWeight: "800" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function Action({
  label,
  icon,
  route,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/(engineer)/messages" | "/(engineer)/projects";
}) {
  return (
    <Pressable onPress={() => router.push(route as never)} style={styles.action}>
      <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function Info({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={22} color={COLORS.WARNING} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{body}</Text>
      </View>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="business-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 10, textAlign: "center" }}>{text}</Text>
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
  stat: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 13,
  },
  progressCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 15,
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
  metric: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row" as const,
    gap: 10,
    minWidth: "40%" as const,
    padding: 12,
  },
  metricIcon: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 16,
    height: 32,
    justifyContent: "center" as const,
    width: 32,
  },
  action: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "center" as const,
    paddingVertical: 13,
  },
  info: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row" as const,
    gap: 12,
    padding: 14,
  },
  empty: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    padding: 28,
  },
};
