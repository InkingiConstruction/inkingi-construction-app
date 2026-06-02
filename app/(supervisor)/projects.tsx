import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorAssignment, SupervisorProject } from "@/components/supervisor/supervisor-types";

export default function SupervisorProjects() {
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

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      const endpoint =
        action === "accept"
          ? ENDPOINTS.PROJECT_MEMBERS.ACCEPT(id)
          : ENDPOINTS.PROJECT_MEMBERS.REJECT(id);
      return api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
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
          : "The client will see that this invitation was declined.",
      );
    },
    onError: (error) => Alert.alert("Action failed", error instanceof Error ? error.message : "Try again."),
  });

  const invitations = invitationsQuery.data || [];
  const projects = projectsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <SupervisorTopBar
              title="Projects"
              subtitle="Accept project invitations first. Accepted projects are ready for inspection and review."
            />
            {invitations.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 14 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>
                  Pending invitations
                </Text>
                {invitations.map((assignment) => (
                  <InvitationCard
                    key={assignment.id}
                    assignment={assignment}
                    loading={respondMutation.isPending}
                    onAccept={() => respondMutation.mutate({ id: assignment.id, action: "accept" })}
                    onReject={() => respondMutation.mutate({ id: assignment.id, action: "reject" })}
                  />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          projectsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
          ) : (
            <EmptyProjects />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching || invitationsQuery.isRefetching}
            onRefresh={() => {
              projectsQuery.refetch();
              invitationsQuery.refetch();
            }}
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => <ProjectCard project={item} />}
      />
    </SafeAreaView>
  );
}

function InvitationCard({
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
  const project = assignment.project;

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
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>INVITED PROJECT</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 6 }}>
        {project?.name || "Project invitation"}
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
        {project?.address || project?.description || "Client is requesting your supervision before inspections can begin."}
      </Text>
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

function ProjectCard({ project }: { project: SupervisorProject }) {
  const milestones = project.milestones || [];
  const pending = milestones.filter((milestone) => milestone.status === "pending_supervisor").length;

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
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY_LIGHT,
            borderRadius: 10,
            height: 48,
            justifyContent: "center",
            width: 48,
          }}
        >
          <Ionicons name="business-outline" size={24} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>
            {project.name}
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            {project.address || project.description || "Assigned construction project"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <MiniStat label="Milestones" value={milestones.length} />
        <MiniStat label="Waiting" value={pending} />
        <MiniStat label="Status" value={project.status} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <ActionButton
          icon="clipboard-outline"
          label="Inspect"
          onPress={() =>
            router.push({
              pathname: "/(supervisor)/inspections",
              params: { projectId: project.id },
            })
          }
        />
        <ActionButton
          icon="images-outline"
          label="Review"
          onPress={() =>
            router.push({
              pathname: "/(supervisor)/progress-review",
              params: { projectId: project.id },
            })
          }
        />
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 12, flex: 1, padding: 10 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label}</Text>
      <Text
        numberOfLines={1}
        style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900", marginTop: 4 }}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 8,
        flex: 1,
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 13,
      }}
    >
      <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function EmptyProjects() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 10,
        borderWidth: 1,
        padding: 28,
      }}
    >
      <Ionicons name="business-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>
        No assigned projects
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6, textAlign: "center" }}>
        Projects appear here only after you accept the client invitation.
      </Text>
    </View>
  );
}
