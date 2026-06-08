import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerMilestone, EngineerProject } from "@/components/engineer/engineer-types";
import { isAcceptedEngineerProject } from "@/components/engineer/engineer-utils";

const statusColor = (status: string) => {
  if (status === "paid") return COLORS.SUCCESS;
  if (status === "awaiting_client_payment") return COLORS.PRIMARY;
  if (status === "pending_supervisor") return "#7C3AED";
  if (status === "revision_required") return COLORS.WARNING;
  if (status === "active") return "#2563EB";
  return COLORS.TEXT_LIGHT;
};

export default function EngineerMilestones() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState(params.projectId || "");
  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState("");
  const [statusActionId, setStatusActionId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () =>
      (await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST)).data.filter(isAcceptedEngineerProject),
    refetchOnMount: "always",
    refetchInterval: 10000,
  });

  const projects = projectsQuery.data || [];
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const activeProject = projects.find((project) => project.id === activeProjectId);

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () =>
      (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId: activeProjectId } })).data,
    refetchInterval: 10000,
  });

  const milestones = milestonesQuery.data || [];
  const completedCount = milestones.filter((milestone) => milestone.status === "paid").length;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectId) throw new Error("Select a project first.");
      if (!name.trim()) {
        throw new Error("Milestone name is required.");
      }

      return api.post(ENDPOINTS.MILESTONES.LIST, {
        projectId: activeProjectId,
        name: name.trim(),
        durationDays: durationDays.trim() ? Number(durationDays) : undefined,
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
        order: milestones.length + 1,
        status: milestones.length === 0 ? "active" : "pending",
      });
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] });
      Alert.alert("Milestone created", "The milestone was added to the project plan.");
    },
    onError: (error) => Alert.alert("Create failed", error instanceof Error ? error.message : "Please try again."),
  });

  const resetForm = () => {
    setEditingMilestoneId("");
    setName("");
    setDurationDays("");
    setAcceptanceCriteria("");
  };

  const updateDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!editingMilestoneId) throw new Error("Select a milestone to edit.");
      if (!name.trim()) {
        throw new Error("Milestone name is required.");
      }

      return api.put(ENDPOINTS.MILESTONES.UPDATE(editingMilestoneId), {
        name: name.trim(),
        durationDays: durationDays.trim() ? Number(durationDays) : undefined,
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
      });
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] });
      Alert.alert("Milestone updated", "You can resend this milestone for supervisor review.");
    },
    onError: (error) => Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again."),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setStatusActionId(id);
      return api.put(ENDPOINTS.MILESTONES.UPDATE(id), { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert("Sent", "The milestone and BOQ package were sent for supervisor review.");
    },
    onError: (error) => Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again."),
    onSettled: () => setStatusActionId(""),
  });

  const startEdit = (milestone: EngineerMilestone) => {
    setEditingMilestoneId(milestone.id);
    setName(milestone.name);
    setDurationDays(milestone.durationDays ? String(milestone.durationDays) : "");
    setAcceptanceCriteria(milestone.acceptanceCriteria || milestone.description || "");
  };
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([projectsQuery.refetch(), milestonesQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ gap: 16 }}>
          <Header />

          {projectsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
          ) : projects.length === 0 ? (
            <Empty text="No accepted engineer projects found. Accept a client assignment first." />
          ) : (
            <>
              <ProjectSelector
                projects={projects}
                activeProjectId={activeProjectId}
                onSelect={(id) => setSelectedProjectId(id)}
              />

              <View style={styles.darkPanel}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.darkEyebrow}>PROJECT PLAN</Text>
                  <Text style={styles.darkTitle}>{activeProject?.name || "Project"}</Text>
                  <Text style={styles.darkBody}>
                    {milestones.length} milestone{milestones.length === 1 ? "" : "s"} • Budget comes from BOQ totals
                  </Text>
                </View>
                <View style={styles.darkIcon}>
                  <Ionicons name="flag-outline" size={26} color={COLORS.TEXT_WHITE} />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <SmallStat label="Total" value={milestones.length} />
                <SmallStat label="Paid" value={completedCount} />
                <SmallStat label="BOQ based" value="Enabled" />
              </View>

              <View style={styles.formCard}>
                <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.cardTitle}>{editingMilestoneId ? "Edit milestone" : "New milestone"}</Text>
                  {editingMilestoneId ? (
                    <Pressable onPress={resetForm}>
                      <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900" }}>Cancel</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  placeholder="Milestone name"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Days"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  keyboardType="numeric"
                  value={durationDays}
                  onChangeText={setDurationDays}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Acceptance criteria"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={acceptanceCriteria}
                  onChangeText={setAcceptanceCriteria}
                  multiline
                  style={[styles.input, { minHeight: 86, textAlignVertical: "top" }]}
                />
                <Pressable
                  disabled={createMutation.isPending || updateDetailsMutation.isPending}
                  onPress={() => (editingMilestoneId ? updateDetailsMutation.mutate() : createMutation.mutate())}
                  style={[
                    styles.primaryButton,
                    (createMutation.isPending || updateDetailsMutation.isPending) && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons
                    name={editingMilestoneId ? "save-outline" : "add-circle-outline"}
                    size={19}
                    color={COLORS.TEXT_WHITE}
                  />
                  <Text style={styles.primaryButtonText}>
                    {editingMilestoneId
                      ? updateDetailsMutation.isPending
                        ? "Saving..."
                        : "Save milestone"
                      : createMutation.isPending
                        ? "Creating..."
                        : "Create milestone"}
                  </Text>
                </Pressable>
              </View>

              {milestonesQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
              {milestones.length === 0 && !milestonesQuery.isLoading ? (
                <Empty text="No milestones yet. Create the first milestone to start planning BOQ and progress." />
              ) : null}
              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  loading={statusActionId === milestone.id && updateStatusMutation.isPending}
                  onEdit={() => startEdit(milestone)}
                  onSetActive={() => updateStatusMutation.mutate({ id: milestone.id, status: "active" })}
                  onSubmitReview={() => updateStatusMutation.mutate({ id: milestone.id, status: "pending_supervisor" })}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
        ENGINEER WORKFLOW
      </Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
        Milestones
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19 }}>
        Build a project plan. Budget value is calculated from BOQ items linked to each milestone.
      </Text>
    </View>
  );
}

function ProjectSelector({
  projects,
  activeProjectId,
  onSelect,
}: {
  projects: EngineerProject[];
  activeProjectId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {projects.map((project) => {
        const active = project.id === activeProjectId;
        return (
          <Pressable
            key={project.id}
            onPress={() => onSelect(project.id)}
            style={{
              backgroundColor: active ? COLORS.PRIMARY : COLORS.SURFACE,
              borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
              borderRadius: 10,
              borderWidth: 1,
              maxWidth: 230,
              padding: 12,
            }}
          >
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
              {project.name}
            </Text>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>
              {project.status}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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

function MilestoneCard({
  milestone,
  loading,
  onEdit,
  onSetActive,
  onSubmitReview,
}: {
  milestone: EngineerMilestone;
  loading: boolean;
  onEdit: () => void;
  onSetActive: () => void;
  onSubmitReview: () => void;
}) {
  const boqTotal = (milestone.boqItems || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const color = statusColor(milestone.status);
  const latestInspection = milestone.inspections?.[0];
  const supervisorNote = latestInspection?.notes?.trim();

  return (
    <View style={styles.milestoneCard}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.statusBar, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontSize: 17, fontWeight: "900" }}>{milestone.name}</Text>
            <StatusPill value={milestone.status} />
          </View>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
            {milestone.description || milestone.acceptanceCriteria || "No description provided."}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Mini label="BOQ total" value={`${boqTotal.toLocaleString()} RWF`} />
        <Mini label="BOQ" value={milestone._count?.boqItems || 0} />
      </View>

      {supervisorNote ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentLabel}>
            {milestone.status === "revision_required" ? "Supervisor revision comment" : "Supervisor comment"}
          </Text>
          <Text style={styles.commentText}>{supervisorNote}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        {["active", "revision_required", "pending"].includes(milestone.status) ? (
          <Pressable disabled={loading} onPress={onEdit} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </Pressable>
        ) : null}
        {milestone.status === "pending" ? (
          <Pressable disabled={loading} onPress={onSetActive} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Mark active</Text>
          </Pressable>
        ) : null}
        {["active", "revision_required"].includes(milestone.status) ? (
          <Pressable disabled={loading} onPress={onSubmitReview} style={styles.primaryButton}>
            <Ionicons name="send-outline" size={17} color={COLORS.TEXT_WHITE} />
            <Text style={styles.primaryButtonText}>{loading ? "Sending..." : "Send for review"}</Text>
          </Pressable>
        ) : null}
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

function StatusPill({ value }: { value: string }) {
  return (
    <View style={{ backgroundColor: `${statusColor(value)}22`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }}>
      <Text style={{ color: statusColor(value), fontSize: 9, fontWeight: "900" }}>
        {value.replace(/_/g, " ").toUpperCase()}
      </Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="flag-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 10, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

const styles = {
  darkPanel: {
    alignItems: "center" as const,
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    flexDirection: "row" as const,
    gap: 12,
    padding: 18,
  },
  darkEyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "900" as const,
  },
  darkTitle: {
    color: COLORS.TEXT_WHITE,
    fontSize: 23,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  darkBody: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  darkIcon: {
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.10)",
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
  formCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: "900" as const,
  },
  input: {
    backgroundColor: COLORS.MUTED,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "center" as const,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: COLORS.TEXT_WHITE,
    fontWeight: "900" as const,
  },
  secondaryButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontWeight: "900" as const,
  },
  milestoneCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  statusBar: {
    borderRadius: 999,
    width: 5,
  },
  mini: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    padding: 9,
  },
  commentBox: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
  },
  commentLabel: {
    color: COLORS.WARNING,
    fontSize: 10,
    fontWeight: "900" as const,
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  commentText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    lineHeight: 18,
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
