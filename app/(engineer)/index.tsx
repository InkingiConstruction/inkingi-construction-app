import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";
import {
  EngineerAssignment,
  EngineerBoqItem,
  EngineerMilestone,
  EngineerProgressPhoto,
  EngineerProject,
  EngineerRfq,
} from "@/components/engineer/engineer-types";
import { isAcceptedEngineerProject, money } from "@/components/engineer/engineer-utils";

export default function EngineerDashboard() {
  const user = useAuthStore((state) => state.user);
  const missingProfileItems = getMissingProfessionalProfileItems(user);

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => (await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
  });

  const assignmentsQuery = useQuery({
    queryKey: ["engineer-assignments"],
    queryFn: async () =>
      (await api.get<EngineerAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST)).data.filter(
        (assignment) => assignment.role?.toLowerCase() === "engineer",
      ),
  });

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones"],
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST)).data,
  });

  const progressQuery = useQuery({
    queryKey: ["engineer-progress-photos"],
    queryFn: async () => (await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST)).data,
  });

  const rfqsQuery = useQuery({
    queryKey: ["engineer-rfqs"],
    queryFn: async () => (await api.get<EngineerRfq[]>(ENDPOINTS.RFQS.LIST)).data,
  });

  const boqQuery = useQuery({
    queryKey: ["engineer-boq-items"],
    queryFn: async () => (await api.get<EngineerBoqItem[]>(ENDPOINTS.BOQ_ITEMS.LIST)).data,
  });

  const projects = (projectsQuery.data || []).filter(isAcceptedEngineerProject);
  const assignments = assignmentsQuery.data || [];
  const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending");
  const milestones = milestonesQuery.data || [];
  const progress = progressQuery.data || [];
  const rfqs = rfqsQuery.data || [];
  const boqItems = boqQuery.data || [];

  const activeProjects = projects.filter((project) => !["completed", "cancelled"].includes(project.status));
  const pendingSupervisor = milestones.filter((milestone) => milestone.status === "pending_supervisor");
  const awaitingClientPayment = milestones.filter((milestone) => milestone.status === "awaiting_client_payment");
  const revisionRequired = milestones.filter((milestone) => milestone.status === "revision_required");
  const rejectedProgress = progress.filter((item) => item.reviewStatus === "rejected");
  const pendingProgress = progress.filter((item) => item.reviewStatus === "pending");
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);

  const nextAction = pendingAssignments[0]
    ? {
        title: "Review project invitation",
        body: `${pendingAssignments[0].project?.name || "A client project"} is waiting for your decision.`,
        icon: "mail-unread-outline" as const,
        route: "/(engineer)/assignments" as const,
      }
    : revisionRequired[0]
      ? {
          title: "Revision requested",
          body: `${revisionRequired[0].name} needs updates before approval.`,
          icon: "refresh-outline" as const,
          route: "/(engineer)/milestones" as const,
          projectId: revisionRequired[0].projectId,
        }
      : pendingSupervisor[0]
        ? {
            title: "Supervisor review pending",
            body: `${pendingSupervisor[0].name} has been submitted for supervisor review.`,
            icon: "shield-checkmark-outline" as const,
            route: "/(engineer)/boq" as const,
            projectId: pendingSupervisor[0].projectId,
          }
        : projects[0]
          ? {
              title: "Open project workspace",
              body: "Create milestones, BOQ, RFQs, and progress updates from one project.",
              icon: "construct-outline" as const,
              route: "/(engineer)/projects" as const,
            }
          : {
              title: "No active contracting work",
              body: "Accept a client invitation to start managing project delivery.",
              icon: "briefcase-outline" as const,
              route: "/(engineer)/assignments" as const,
            };

  const loading =
    projectsQuery.isLoading ||
    assignmentsQuery.isLoading ||
    milestonesQuery.isLoading ||
    progressQuery.isLoading;
  const refreshing =
    projectsQuery.isRefetching ||
    assignmentsQuery.isRefetching ||
    milestonesQuery.isRefetching ||
    progressQuery.isRefetching ||
    rfqsQuery.isRefetching ||
    boqQuery.isRefetching;

  const refresh = () => {
    projectsQuery.refetch();
    assignmentsQuery.refetch();
    milestonesQuery.refetch();
    progressQuery.refetch();
    rfqsQuery.refetch();
    boqQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ gap: 16 }}>
          <Header userName={user?.name || "Main Contractor"} />
          {missingProfileItems.length > 0 ? (
            <ProfileReminder
              missing={missingProfileItems}
              onPress={() => router.push("/(engineer)/profile-edit" as never)}
            />
          ) : null}

          {loading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
          ) : (
            <>
              <NextActionCard
                title={nextAction.title}
                body={nextAction.body}
                icon={nextAction.icon}
                onPress={() =>
                  router.push(
                    nextAction.projectId
                      ? ({ pathname: nextAction.route, params: { projectId: nextAction.projectId } } as never)
                      : (nextAction.route as never),
                  )
                }
              />

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <MetricCard icon="business-outline" label="Projects" value={projects.length} onPress={() => router.push("/(engineer)/projects")} />
                <MetricCard icon="mail-unread-outline" label="Invites" value={pendingAssignments.length} onPress={() => router.push("/(engineer)/assignments" as never)} />
                <MetricCard icon="flag-outline" label="Milestones" value={milestones.length} onPress={() => router.push("/(engineer)/milestones" as never)} />
                <MetricCard icon="alert-circle-outline" label="Revisions" value={revisionRequired.length} tone="warning" onPress={() => router.push("/(engineer)/milestones" as never)} />
              </View>

              <View style={styles.darkPanel}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.darkEyebrow}>CONTRACTOR PORTFOLIO</Text>
                  <Text style={styles.darkValue}>{money(totalBudget)}</Text>
                  <Text style={styles.darkBody}>
                    {activeProjects.length} active project{activeProjects.length === 1 ? "" : "s"} under your delivery workspace.
                  </Text>
                </View>
                <View style={styles.darkIcon}>
                  <Ionicons name="analytics-outline" size={26} color={COLORS.TEXT_WHITE} />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <SmallStat label="BOQ items" value={boqItems.length} />
                <SmallStat label="RFQs" value={rfqs.length} />
                <SmallStat label="Progress" value={progress.length} />
              </View>

              <SectionHeader title="Project Workbench" action="View all" onPress={() => router.push("/(engineer)/projects")} />
              {projects.length === 0 ? (
                <EmptyState />
              ) : (
                projects.slice(0, 4).map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    milestones={milestones.filter((milestone) => milestone.projectId === project.id)}
                    pendingProgress={pendingProgress.filter((item) => item.projectId === project.id).length}
                    rejectedProgress={rejectedProgress.filter((item) => item.projectId === project.id).length}
                  />
                ))
              )}

              {awaitingClientPayment.length > 0 ? (
                <InfoStrip
                  icon="card-outline"
                  title={`${awaitingClientPayment.length} milestone${awaitingClientPayment.length === 1 ? "" : "s"} awaiting client payment`}
                  body="The client can release escrow payment after approved BOQ and milestones."
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getMissingProfessionalProfileItems(user: ReturnType<typeof useAuthStore.getState>["user"]) {
  const roleSpecific =
    user?.roleSpecific && typeof user.roleSpecific === "object"
      ? (user.roleSpecific as Record<string, unknown>)
      : {};
  const missing: string[] = [];

  if (!(user?.image || user?.avatar)) missing.push("profile photo");
  if (!roleSpecific.bio) missing.push("bio");
  if (!(roleSpecific.specialty || roleSpecific.specialization || roleSpecific.focusArea)) missing.push("specialty");
  if (!roleSpecific.yearsOfExperience) missing.push("experience");
  if (!Array.isArray(roleSpecific.skills) || roleSpecific.skills.length === 0) missing.push("skills");
  if (!Array.isArray(roleSpecific.certifications) || roleSpecific.certifications.length === 0) missing.push("certifications");
  if (!Array.isArray(roleSpecific.recentJobs) || roleSpecific.recentJobs.length === 0) missing.push("portfolio projects");

  return missing;
}

function ProfileReminder({ missing, onPress }: { missing: string[]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderColor: COLORS.PRIMARY,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        padding: 14,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: COLORS.SURFACE,
          borderRadius: 9,
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        <Ionicons name="person-add-outline" size={20} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 14, fontWeight: "900" }}>
          Complete your professional profile
        </Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 3 }}>
          Add {missing.slice(0, 3).join(", ")}
          {missing.length > 3 ? ` and ${missing.length - 3} more` : ""} so clients can trust your portfolio.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.PRIMARY_DARK} />
    </Pressable>
  );
}

function Header({ userName }: { userName: string }) {
  return (
    <View style={{ gap: 14, marginBottom: 2 }}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
            MAIN CONTRACTOR PORTAL
          </Text>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
            Dashboard
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            Milestones, BOQ, RFQs, and site progress in one workbench.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TopButton icon="notifications-outline" onPress={() => router.push("/(engineer)/notifications" as never)} />
          <TopButton icon="settings-outline" onPress={() => router.push("/(engineer)/settings" as never)} />
        </View>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityIcon}>
          <Ionicons name="construct-outline" size={22} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{userName}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 3 }}>
            Plan milestones, submit BOQ, request suppliers, and upload progress for review.
          </Text>
        </View>
      </View>
    </View>
  );
}

function TopButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.topButton}>
      <Ionicons name={icon} size={21} color={COLORS.TEXT_PRIMARY} />
    </Pressable>
  );
}

function NextActionCard({
  title,
  body,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <View style={styles.nextCard}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900", opacity: 0.7 }}>
          NEXT CONTRACTOR ACTION
        </Text>
        <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 24, fontWeight: "900", marginTop: 8 }}>
          {title}
        </Text>
        <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
          {body}
        </Text>
        <Pressable onPress={onPress} style={styles.nextButton}>
          <Ionicons name="arrow-forward" size={18} color={COLORS.TEXT_WHITE} />
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Open workflow</Text>
        </Pressable>
      </View>
      <View style={styles.nextIcon}>
        <Ionicons name={icon} size={30} color={COLORS.TEXT_WHITE} />
      </View>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone = "primary",
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tone?: "primary" | "warning";
  onPress: () => void;
}) {
  const iconColor = tone === "warning" ? COLORS.WARNING : COLORS.PRIMARY;
  const bg = tone === "warning" ? "#FEF3C7" : COLORS.PRIMARY_LIGHT;
  return (
    <Pressable onPress={onPress} style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{value}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 10, fontWeight: "800" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.smallStat}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label.toUpperCase()}</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
      <Pressable onPress={onPress}>
        <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900" }}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ProjectRow({
  project,
  milestones,
  pendingProgress,
  rejectedProgress,
}: {
  project: EngineerProject;
  milestones: EngineerMilestone[];
  pendingProgress: number;
  rejectedProgress: number;
}) {
  const supervisor = project.projectMembers?.find(
    (member) => member.role?.toLowerCase() === "supervisor" && member.status?.toLowerCase() === "accepted",
  );
  const completed = milestones.filter((milestone) => milestone.status === "paid").length;
  const progressPct = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <View style={styles.projectCard}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={styles.projectIcon}>
          <Ionicons name="business-outline" size={23} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>{project.name}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 3 }} numberOfLines={2}>
            {project.address || project.description || "Assigned construction project"}
          </Text>
        </View>
        <StatusPill value={project.status} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Mini label="Milestones" value={`${completed}/${milestones.length}`} />
        <Mini label="Supervisor" value={supervisor?.user?.name || (supervisor ? "Accepted" : "Pending")} />
        <Mini label="Media review" value={rejectedProgress ? `${rejectedProgress} rejected` : `${pendingProgress} pending`} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <Action icon="flag-outline" label="Milestones" route="/(engineer)/milestones" projectId={project.id} />
        <Action icon="list-outline" label="BOQ" route="/(engineer)/boq" projectId={project.id} />
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Action icon="receipt-outline" label="RFQs" route="/(engineer)/rfqs" projectId={project.id} />
        <Action icon="camera-outline" label="Progress" route="/(engineer)/progress" projectId={project.id} />
      </View>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.mini}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 9, fontWeight: "900" }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 11, fontWeight: "900", marginTop: 3 }}>
        {value}
      </Text>
    </View>
  );
}

function Action({
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
      onPress={() => router.push({ pathname: route, params: { projectId } } as never)}
      style={styles.actionButton}
    >
      <Ionicons name={icon} size={17} color={COLORS.TEXT_WHITE} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 9, fontWeight: "900" }}>
        {value.replace(/_/g, " ").toUpperCase()}
      </Text>
    </View>
  );
}

function InfoStrip({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.infoStrip}>
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY_DARK} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 3 }}>{body}</Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="briefcase-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>No accepted projects</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6, textAlign: "center" }}>
        Accept a client invitation first, then your Main Contractor workspace appears here.
      </Text>
    </View>
  );
}

const styles = {
  identityCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row" as const,
    gap: 12,
    padding: 14,
  },
  identityIcon: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    height: 44,
    justifyContent: "center" as const,
    width: 44,
  },
  topButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center" as const,
    width: 42,
  },
  nextCard: {
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    flexDirection: "row" as const,
    gap: 12,
    overflow: "hidden" as const,
    padding: 18,
  },
  nextButton: {
    alignItems: "center" as const,
    alignSelf: "flex-start" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nextIcon: {
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    height: 58,
    justifyContent: "center" as const,
    width: 58,
  },
  metricCard: {
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
    borderRadius: 16,
    height: 32,
    justifyContent: "center" as const,
    width: 32,
  },
  darkPanel: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row" as const,
    gap: 12,
    padding: 16,
  },
  darkEyebrow: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 10,
    fontWeight: "900" as const,
  },
  darkValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  darkBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  darkIcon: {
    alignItems: "center" as const,
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    height: 52,
    justifyContent: "center" as const,
    width: 52,
  },
  smallStat: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  projectCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  projectIcon: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    height: 46,
    justifyContent: "center" as const,
    width: 46,
  },
  statusPill: {
    alignSelf: "flex-start" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  progressTrack: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden" as const,
  },
  progressFill: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 999,
    height: "100%" as const,
  },
  mini: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    marginTop: 12,
    padding: 9,
  },
  actionButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row" as const,
    gap: 7,
    justifyContent: "center" as const,
    paddingVertical: 11,
  },
  infoStrip: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    flexDirection: "row" as const,
    gap: 10,
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
