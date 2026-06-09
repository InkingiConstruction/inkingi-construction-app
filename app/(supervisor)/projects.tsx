import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorAssignment, SupervisorProject } from "@/components/supervisor/supervisor-types";
import { ProjectFeed } from "@/components/shared/project-feed";

export default function SupervisorProjects() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<SupervisorProject | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<SupervisorAssignment | null>(null);
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
    refetchInterval: 10000,
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
    refetchInterval: 10000,
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
      setSelectedInvitation(null);
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
                    onOpen={() => setSelectedInvitation(assignment)}
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
        renderItem={({ item }) => <ProjectCard project={item} onOpen={() => setSelectedProject(item)} />}
      />
      <ProjectDetailSheet
        project={selectedProject}
        visible={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />
      <InvitationDetailSheet
        assignment={selectedInvitation}
        loading={respondMutation.isPending}
        visible={Boolean(selectedInvitation)}
        onAccept={() => selectedInvitation && respondMutation.mutate({ id: selectedInvitation.id, action: "accept" })}
        onClose={() => setSelectedInvitation(null)}
        onReject={() => selectedInvitation && respondMutation.mutate({ id: selectedInvitation.id, action: "reject" })}
      />
    </SafeAreaView>
  );
}

function InvitationCard({
  assignment,
  loading,
  onOpen,
}: {
  assignment: SupervisorAssignment;
  loading: boolean;
  onOpen: () => void;
}) {
  const project = assignment.project;

  return (
    <Pressable
      onPress={onOpen}
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
      <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 14, paddingVertical: 12 }}>
        <Ionicons name="document-text-outline" size={18} color={COLORS.PRIMARY_DARK} />
        <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>
          {loading ? "Saving..." : "View full details"}
        </Text>
      </View>
    </Pressable>
  );
}

function ProjectCard({ project, onOpen }: { project: SupervisorProject; onOpen: () => void }) {
  const milestones = project.milestones || [];
  const pending = milestones.filter((milestone) => milestone.status === "pending_supervisor").length;

  return (
    <Pressable
      onPress={onOpen}
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
      <View style={{ alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 12 }}>
        <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 12, fontWeight: "900" }}>Tap card for full details</Text>
        <Ionicons name="chevron-up-outline" size={16} color={COLORS.PRIMARY_DARK} />
      </View>
    </Pressable>
  );
}

function ProjectDetailSheet({
  project,
  visible,
  onClose,
}: {
  project: SupervisorProject | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!project) return null;

  const milestones = project.milestones || [];
  const members = project.projectMembers || [];

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <SheetHeader title={project.name} label="PROJECT DETAILS" onClose={onClose} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <DetailBlock>
              <InfoLine label="Status" value={project.status} />
              <InfoLine label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency || "RWF"}`} />
              <InfoLine label="Location" value={project.address || "Not provided"} />
              <InfoLine label="Client" value={project.client?.name || project.client?.email || "Client"} />
              <InfoLine label="Engineer" value={project.engineer?.name || project.engineer?.email || "Not assigned"} />
            </DetailBlock>
            <DetailSection title="Description" body={project.description || "No description provided."} />
            <DetailSection title="Team" body={members.length ? members.map((member) => `${member.role}: ${member.user?.name || member.user?.email || member.status} (${member.status})`).join("\n") : "No team members listed."} />
            <View style={{ marginTop: 14 }}>
              <ProjectFeed projectId={project.id} />
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.sectionTitle}>Milestones ({milestones.length})</Text>
              {milestones.length === 0 ? (
                <Text style={styles.sectionBody}>No milestones have been created yet.</Text>
              ) : (
                milestones.map((milestone) => (
                  <View key={milestone.id} style={styles.milestoneRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneTitle}>{milestone.name}</Text>
                      <Text style={styles.sectionBody}>{String(milestone.status).replace(/_/g, " ")}</Text>
                    </View>
                    <Text style={styles.milestonePercent}>{Number(milestone.budgetPercentage || 0)}%</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InvitationDetailSheet({
  assignment,
  visible,
  loading,
  onClose,
  onAccept,
  onReject,
}: {
  assignment: SupervisorAssignment | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!assignment?.project) return null;
  const project = assignment.project;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <SheetHeader title={project.name} label="SUPERVISOR INVITATION" onClose={onClose} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <DetailBlock>
              <InfoLine label="Status" value={project.status} />
              <InfoLine label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency || "RWF"}`} />
              <InfoLine label="Location" value={project.address || "Not provided"} />
              <InfoLine label="Client" value={project.client?.name || project.client?.email || "Client"} />
              <InfoLine label="Engineer" value={project.engineer?.name || project.engineer?.email || "Not assigned"} />
            </DetailBlock>
            <DetailSection title="Description" body={project.description || "No description provided."} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable disabled={loading} onPress={onReject} style={styles.rejectButton}>
                <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
              </Pressable>
              <Pressable disabled={loading} onPress={onAccept} style={[styles.acceptButton, loading && { opacity: 0.7 }]}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{loading ? "Saving..." : "Accept"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SheetHeader({ label, title, onClose }: { label: string; title: string; onClose: () => void }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sheetEyebrow}>{label}</Text>
        <Text style={styles.sheetTitle}>{title}</Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={COLORS.TEXT_PRIMARY} />
      </Pressable>
    </View>
  );
}

function DetailBlock({ children }: { children: ReactNode }) {
  return <View style={styles.detailBlock}>{children}</View>;
}

function DetailSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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

const styles = {
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  sheetScrim: {
    backgroundColor: "rgba(15,23,42,0.45)",
    bottom: 0,
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%" as const,
    padding: 18,
    paddingBottom: 0,
  },
  sheetHandle: {
    alignSelf: "center" as const,
    backgroundColor: COLORS.BORDER,
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 44,
  },
  sheetEyebrow: {
    color: COLORS.PRIMARY,
    fontSize: 10,
    fontWeight: "900" as const,
  },
  sheetTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 3,
  },
  closeButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 999,
    height: 36,
    justifyContent: "center" as const,
    width: 36,
  },
  detailBlock: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  infoLine: {
    alignItems: "center" as const,
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    flexDirection: "row" as const,
    gap: 10,
    justifyContent: "space-between" as const,
    paddingVertical: 9,
  },
  infoLabel: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  infoValue: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 12,
    fontWeight: "900" as const,
    textAlign: "right" as const,
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  sectionBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  milestoneRow: {
    alignItems: "center" as const,
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    flexDirection: "row" as const,
    gap: 10,
    paddingVertical: 10,
  },
  milestoneTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  milestonePercent: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "900" as const,
  },
  rejectButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  acceptButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
};
