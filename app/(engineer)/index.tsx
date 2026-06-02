import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import {
  EngineerAssignment,
  EngineerMilestone,
  EngineerProgressPhoto,
  EngineerProject,
  EngineerRfq,
} from "@/components/engineer/engineer-types";
import { useAuthStore } from "@/store/auth.store";

type NotificationItem = {
  id: string;
  status: string;
};

export default function EngineerIndex() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ["engineer-assignments"],
    queryFn: async () => {
      const response = await api.get<EngineerAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST);
      return response.data.filter((assignment) => assignment.role?.toLowerCase() === "engineer");
    },
    refetchOnMount: "always",
  });

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => {
      const response = await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST);
      return response.data.filter((project) => project.engineerId);
    },
    refetchOnMount: "always",
  });

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones"],
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST)).data,
  });

  const progressQuery = useQuery({
    queryKey: ["engineer-progress"],
    queryFn: async () => (await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST)).data,
  });

  const rfqsQuery = useQuery({
    queryKey: ["engineer-rfqs"],
    queryFn: async () => (await api.get<EngineerRfq[]>(ENDPOINTS.RFQS.LIST)).data,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<NotificationItem[]>(ENDPOINTS.NOTIFICATIONS.LIST)).data,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      const endpoint =
        action === "accept"
          ? ENDPOINTS.PROJECT_MEMBERS.ACCEPT(id)
          : ENDPOINTS.PROJECT_MEMBERS.REJECT(id);
      return api.post(endpoint);
    },
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-assignments"] }),
        queryClient.refetchQueries({ queryKey: ["engineer-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] }),
      ]);
      Alert.alert(
        variables.action === "accept" ? "Project accepted" : "Project declined",
        variables.action === "accept"
          ? "The project is now available in your workspace."
          : "The invitation has been declined.",
      );
    },
    onError: (error) => Alert.alert("Action failed", error instanceof Error ? error.message : "Try again."),
  });

  const assignments = assignmentsQuery.data || [];
  const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending");
  const projects = projectsQuery.data || [];
  const milestones = milestonesQuery.data || [];
  const progress = progressQuery.data || [];
  const rfqs = rfqsQuery.data || [];
  const unreadAlerts = (notificationsQuery.data || []).filter((item) => item.status !== "read").length;
  const reviewQueue = milestones.filter((milestone) => milestone.status === "revision_required");
  const draftMilestones = milestones.filter((milestone) => ["pending", "active"].includes(milestone.status));
  const loading = assignmentsQuery.isLoading || projectsQuery.isLoading || milestonesQuery.isLoading;
  const nextProject = projects[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
          <View style={{ alignItems: "center", flex: 1, flexDirection: "row", gap: 12 }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: COLORS.PRIMARY,
                borderRadius: 10,
                height: 48,
                justifyContent: "center",
                width: 48,
              }}
            >
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 18, fontWeight: "900" }}>
                {(user?.name || "E").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>ENGINEER DESK</Text>
              <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "900" }}>
                {user?.name || "Engineer"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <HeaderButton icon="notifications-outline" badge={unreadAlerts} onPress={() => router.push("/(engineer)/notifications")} />
            <HeaderButton icon="person-circle-outline" onPress={() => router.push("/(engineer)/profile")} />
            <HeaderButton icon="settings-outline" onPress={() => router.push("/(engineer)/settings")} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 80 }} />
        ) : (
          <View style={{ gap: 16 }}>
            {pendingAssignments[0] ? (
              <InvitationPanel
                assignment={pendingAssignments[0]}
                loading={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ id: pendingAssignments[0].id, action: "accept" })}
                onReject={() => respondMutation.mutate({ id: pendingAssignments[0].id, action: "reject" })}
              />
            ) : null}

            <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, overflow: "hidden", padding: 20 }}>
              <View
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  height: 82,
                  opacity: 0.35,
                  position: "absolute",
                  right: -32,
                  top: 36,
                  transform: [{ rotate: "-12deg" }],
                  width: "80%",
                }}
              />
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "800", opacity: 0.75 }}>
                Active site focus
              </Text>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 24, fontWeight: "900", marginTop: 8 }}>
                {nextProject?.name || "No active project"}
              </Text>
              <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                {nextProject
                  ? nextProject.address || "Open the project to manage milestones, BOQ, RFQs, and site progress."
                  : "Accept a client assignment to start planning project work."}
              </Text>
              <Pressable
                onPress={() => router.push(nextProject ? "/(engineer)/projects" : "/(engineer)/assignments")}
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 8,
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 18,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name={nextProject ? "business-outline" : "briefcase-outline"} size={18} color={COLORS.TEXT_WHITE} />
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                  {nextProject ? "Open Projects" : "View Invitations"}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric title="Projects" value={projects.length} icon="business-outline" />
              <Metric title="Draft stages" value={draftMilestones.length} icon="flag-outline" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric title="RFQs" value={rfqs.length} icon="receipt-outline" />
              <Metric title="Uploads" value={progress.length} icon="images-outline" />
            </View>

            <Section title="Project actions" action="Projects" onPress={() => router.push("/(engineer)/projects")}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuickAction icon="flag-outline" title="Milestones" subtitle="By project" onPress={() => router.push("/(engineer)/projects")} />
                <QuickAction icon="list-outline" title="BOQ" subtitle="Cost items" onPress={() => router.push("/(engineer)/projects")} />
              </View>
            </Section>

            <Section title="Needs attention" action="All" onPress={() => router.push("/(engineer)/projects")}>
              {reviewQueue.length === 0 && pendingAssignments.length === 0 ? (
                <EmptyLine text="No revisions or pending invitations right now." />
              ) : (
                <>
                  {pendingAssignments.slice(0, 2).map((assignment) => (
                    <QueueItem
                      key={assignment.id}
                      title={assignment.project?.name || "Project invitation"}
                      subtitle="Client is waiting for your response"
                      status={assignment.status}
                      onPress={() => router.push("/(engineer)/assignments")}
                    />
                  ))}
                  {reviewQueue.slice(0, 3).map((milestone) => (
                    <QueueItem
                      key={milestone.id}
                      title={milestone.name}
                      subtitle={milestone.project?.name || "Milestone needs revision"}
                      status={milestone.status}
                      onPress={() =>
                        router.push({
                          pathname: "/(engineer)/milestones",
                          params: { projectId: milestone.projectId },
                        })
                      }
                    />
                  ))}
                </>
              )}
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderButton({
  icon,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 8,
        borderWidth: 1,
        height: 44,
        justifyContent: "center",
        width: 44,
      }}
    >
      <Ionicons name={icon} size={21} color={COLORS.TEXT_PRIMARY} />
      {badge ? (
        <View
          style={{
            alignItems: "center",
            backgroundColor: COLORS.ERROR,
            borderRadius: 8,
            height: 16,
            justifyContent: "center",
            position: "absolute",
            right: -2,
            top: -2,
            width: 16,
          }}
        >
          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 9, fontWeight: "900" }}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function InvitationPanel({
  assignment,
  loading,
  onAccept,
  onReject,
}: {
  assignment: EngineerAssignment;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.PRIMARY, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>PROJECT INVITATION</Text>
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 6 }}>
        {assignment.project?.name || "Assigned project"}
      </Text>
      <Text numberOfLines={2} style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
        {assignment.project?.address || assignment.project?.description || "Client is requesting your engineering work."}
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Pressable disabled={loading} onPress={onReject} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, paddingVertical: 12 }}>
          <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
        </Pressable>
        <Pressable disabled={loading} onPress={onAccept} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, paddingVertical: 12 }}>
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{loading ? "Saving..." : "Accept"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flex: 1, padding: 14 }}>
      <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 22, fontWeight: "900", marginTop: 8 }}>{value}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800", marginTop: 2 }}>{title}</Text>
    </View>
  );
}

function Section({ title, action, onPress, children }: { title: string; action: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
        <Pressable onPress={onPress}>
          <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900" }}>{action}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function QuickAction({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flex: 1, padding: 14 }}>
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "900", marginTop: 10 }}>{title}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
    </Pressable>
  );
}

function QueueItem({ title, subtitle, status, onPress }: { title: string; subtitle: string; status: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 14 }}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
        <View style={{ backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, height: 36, width: 36, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="alert-circle-outline" size={19} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
          <Text numberOfLines={1} style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
        </View>
        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{status}</Text>
      </View>
    </Pressable>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
