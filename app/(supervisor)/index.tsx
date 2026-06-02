import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import {
  SupervisorAssignment,
  SupervisorInspection,
  SupervisorProgressPhoto,
  SupervisorProject,
} from "@/components/supervisor/supervisor-types";
import { useAuthStore } from "@/store/auth.store";

type NotificationItem = {
  id: string;
  status: string;
};

export default function SupervisorIndex() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: ["supervisor-projects"],
    queryFn: async () => {
      const response = await api.get<SupervisorProject[]>(ENDPOINTS.PROJECTS.LIST);
      return response.data.filter((project) =>
        (project.projectMembers || []).some(
          (member) =>
            member.role?.toLowerCase() === "supervisor" &&
            member.status?.toLowerCase() === "accepted",
        ),
      );
    },
    refetchOnMount: "always",
  });
  const invitationsQuery = useQuery({
    queryKey: ["supervisor-project-invitations"],
    queryFn: async () => {
      const response = await api.get<SupervisorAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST, {
        params: { status: "pending" },
      });
      return response.data.filter((assignment) => assignment.role?.toLowerCase() === "supervisor");
    },
    refetchOnMount: "always",
  });
  const inspectionsQuery = useQuery({
    queryKey: ["supervisor-inspections"],
    queryFn: async () => {
      const response = await api.get<SupervisorInspection[]>(ENDPOINTS.INSPECTIONS.LIST);
      return response.data;
    },
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
        queryClient.refetchQueries({ queryKey: ["supervisor-project-invitations"] }),
        queryClient.refetchQueries({ queryKey: ["supervisor-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["supervisor-inspections"] }),
        queryClient.invalidateQueries({ queryKey: ["supervisor-progress"] }),
      ]);
      Alert.alert(
        variables.action === "accept" ? "Project accepted" : "Project declined",
        variables.action === "accept"
          ? "The project is now available in your supervisor workspace."
          : "The invitation has been declined.",
      );
    },
    onError: (error) => Alert.alert("Action failed", error instanceof Error ? error.message : "Try again."),
  });
  const progressQuery = useQuery({
    queryKey: ["supervisor-progress"],
    queryFn: async () => {
      const response = await api.get<SupervisorProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST);
      return response.data;
    },
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<NotificationItem[]>(ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    },
  });

  const projects = projectsQuery.data || [];
  const invitations = invitationsQuery.data || [];
  const inspections = inspectionsQuery.data || [];
  const progress = progressQuery.data || [];
  const unreadAlerts = (notificationsQuery.data || []).filter((item) => item.status !== "read").length;
  const pendingMilestones = projects.flatMap((project) =>
    (project.milestones || [])
      .filter((milestone) => milestone.status === "pending_supervisor")
      .map((milestone) => ({ ...milestone, project })),
  );
  const latestProgress = progress.slice(0, 3);
  const loading =
    projectsQuery.isLoading ||
    invitationsQuery.isLoading ||
    inspectionsQuery.isLoading ||
    progressQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
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
                {(user?.name || "S").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900", letterSpacing: 0 }}>
                SUPERVISOR DESK
              </Text>
              <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "900" }}>
                {user?.name || "Supervisor"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <HeaderButton
              icon="notifications-outline"
              badge={unreadAlerts}
              onPress={() => router.push("/(supervisor)/notifications")}
            />
            <HeaderButton icon="settings-outline" onPress={() => router.push("/(supervisor)/settings")} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 80 }} />
        ) : (
          <View style={{ gap: 16 }}>
            {invitations[0] ? (
              <InvitationPanel
                assignment={invitations[0]}
                loading={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ id: invitations[0].id, action: "accept" })}
                onReject={() => respondMutation.mutate({ id: invitations[0].id, action: "reject" })}
              />
            ) : null}

            <View
              style={{
                backgroundColor: COLORS.INK,
                borderRadius: 12,
                overflow: "hidden",
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  height: 80,
                  opacity: 0.35,
                  position: "absolute",
                  right: -30,
                  top: 34,
                  transform: [{ rotate: "-12deg" }],
                  width: "80%",
                }}
              />
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "800", opacity: 0.75 }}>
                Next inspection task
              </Text>
              <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 24, fontWeight: "900", marginTop: 8 }}>
                {pendingMilestones[0]?.name || "No pending milestone"}
              </Text>
              <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                {pendingMilestones[0]
                  ? pendingMilestones[0].project?.name || "Milestone is ready for quality review."
                  : "Engineer progress will appear here when a milestone is ready for supervisor inspection."}
              </Text>
              <Pressable
                onPress={() =>
                  pendingMilestones[0]
                    ? router.push({
                        pathname: "/(supervisor)/inspections",
                        params: {
                          projectId: pendingMilestones[0].projectId,
                          milestoneId: pendingMilestones[0].id,
                        },
                      })
                    : router.push("/(supervisor)/projects")
                }
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
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.TEXT_WHITE} />
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                  {pendingMilestones[0] ? "Open Inspection" : "View Projects"}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric title="Projects" value={projects.length} icon="business-outline" />
              <Metric title="Waiting" value={pendingMilestones.length} icon="clipboard-outline" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric title="Reports" value={inspections.length} icon="document-text-outline" />
              <Metric title="Invites" value={invitations.length} icon="mail-unread-outline" />
            </View>

            <Section title="Quick actions" action="Projects" onPress={() => router.push("/(supervisor)/projects")}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuickAction
                  icon="business-outline"
                  title="Assigned"
                  subtitle="Open sites"
                  onPress={() => router.push("/(supervisor)/projects")}
                />
                <QuickAction
                  icon="chatbubbles-outline"
                  title="Messages"
                  subtitle="Project chat"
                  onPress={() => router.push("/(supervisor)/messages")}
                />
              </View>
            </Section>

            <Section title="Priority queue" action="All" onPress={() => router.push("/(supervisor)/projects")}>
              {pendingMilestones.length === 0 ? (
                <EmptyLine text="No milestone is waiting for supervisor inspection." />
              ) : (
                pendingMilestones.slice(0, 4).map((milestone) => (
                  <QueueItem
                    key={milestone.id}
                    title={milestone.name}
                    subtitle={milestone.project?.name || "Assigned project"}
                    status={milestone.status}
                    onPress={() =>
                      router.push({
                        pathname: "/(supervisor)/inspections",
                        params: { projectId: milestone.projectId, milestoneId: milestone.id },
                      })
                    }
                  />
                ))
              )}
            </Section>

            <Section title="Recent progress" action="Review" onPress={() => router.push("/(supervisor)/progress-review")}>
              {latestProgress.length === 0 ? (
                <EmptyLine text="No progress media is available for review." />
              ) : (
                latestProgress.map((item) => (
                  <QueueItem
                    key={item.id}
                    title={item.milestone?.name || "Progress upload"}
                    subtitle={item.project?.name || item.caption || "Engineer upload"}
                    status={item.isVideo ? "video" : "photo"}
                    onPress={() =>
                      router.push({
                        pathname: "/(supervisor)/progress-review",
                        params: { projectId: item.projectId },
                      })
                    }
                  />
                ))
              )}
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InvitationPanel({
  assignment,
  loading,
  onAccept,
  onReject,
}: {
  assignment: SupervisorAssignment;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.PRIMARY,
        borderRadius: 10,
        borderWidth: 1,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY_LIGHT,
            borderRadius: 10,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
        >
          <Ionicons name="mail-unread-outline" size={22} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
            PROJECT INVITATION
          </Text>
          <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900", marginTop: 4 }}>
            {assignment.project?.name || "New project assignment"}
          </Text>
          <Text numberOfLines={2} style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            {assignment.project?.address || assignment.project?.description || "Client is waiting for your supervision response."}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Pressable
          disabled={loading}
          onPress={onReject}
          style={{
            alignItems: "center",
            backgroundColor: COLORS.MUTED,
            borderRadius: 8,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={onAccept}
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY,
            borderRadius: 8,
            flex: 1,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
            {loading ? "Saving..." : "Accept"}
          </Text>
        </Pressable>
      </View>
    </View>
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
          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 9, fontWeight: "900" }}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        padding: 16,
      }}
    >
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900", marginTop: 10 }}>
        {value}
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800", marginTop: 2 }}>
        {title}
      </Text>
    </View>
  );
}

function Section({
  title,
  action,
  children,
  onPress,
}: {
  title: string;
  action: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 10,
        borderWidth: 1,
        padding: 16,
      }}
    >
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
        <Pressable onPress={onPress}>
          <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>{action}</Text>
        </Pressable>
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: COLORS.MUTED,
        borderRadius: 10,
        flex: 1,
        padding: 14,
      }}
    >
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", marginTop: 10 }}>{title}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
    </Pressable>
  );
}

function QueueItem({
  title,
  subtitle,
  status,
  onPress,
}: {
  title: string;
  subtitle: string;
  status: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.MUTED,
        borderRadius: 8,
        flexDirection: "row",
        gap: 12,
        padding: 13,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: COLORS.PRIMARY_LIGHT,
          borderRadius: 8,
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        <Ionicons name="chevron-forward-outline" size={20} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
      </View>
      <Text style={{ color: COLORS.PRIMARY, fontSize: 11, fontWeight: "900" }}>{status}</Text>
    </Pressable>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, padding: 14 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}
