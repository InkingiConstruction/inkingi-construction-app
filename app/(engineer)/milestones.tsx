import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerMilestone, EngineerProject } from "@/components/engineer/engineer-types";

export default function EngineerMilestones() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [name, setName] = useState("");
  const [budgetPercentage, setBudgetPercentage] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => (await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
  });

  const projects = (projectsQuery.data || []).filter((project) => project.engineerId);
  const activeProjectId = selectedProjectId || params.projectId || projects[0]?.id || "";

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => {
      const response = await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, {
        params: { projectId: activeProjectId },
      });
      return response.data;
    },
  });

  const milestones = milestonesQuery.data || [];
  const nextOrder = milestones.length + 1;
  const totalBudget = milestones.reduce((sum, milestone) => sum + Number(milestone.budgetPercentage || 0), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectId) throw new Error("Select an accepted project first.");
      if (!name.trim() || !budgetPercentage.trim()) throw new Error("Name and budget percentage are required.");
      return api.post(ENDPOINTS.MILESTONES.LIST, {
        projectId: activeProjectId,
        name: name.trim(),
        budgetPercentage: Number(budgetPercentage),
        durationDays: durationDays ? Number(durationDays) : undefined,
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
        order: nextOrder,
      });
    },
    onSuccess: async () => {
      setName("");
      setBudgetPercentage("");
      setDurationDays("");
      setAcceptanceCriteria("");
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-milestones", activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-projects"] }),
      ]);
      Alert.alert("Milestone created", "The milestone is ready for BOQ items and progress tracking.");
    },
    onError: (error) => Alert.alert("Create failed", error instanceof Error ? error.message : "Try again."),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.put(ENDPOINTS.MILESTONES.DETAIL(id), { status: "pending_supervisor" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-milestones", activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["supervisor-milestones"] }),
      ]);
      Alert.alert("Sent to supervisor", "The supervisor can now review this milestone.");
    },
    onError: (error) => Alert.alert("Submit failed", error instanceof Error ? error.message : "Try again."),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>Milestones</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Create project stages and send completed work to the supervisor for review.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty text="No accepted engineer projects found. Accept an assignment first." />
        ) : (
          <>
            <ProjectSelector projects={projects} activeProjectId={activeProjectId} onSelect={setSelectedProjectId} />

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16, gap: 10 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>New milestone</Text>
              <Input placeholder="Milestone name" value={name} onChangeText={setName} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Input keyboardType="numeric" placeholder="Budget %" value={budgetPercentage} onChangeText={setBudgetPercentage} />
                <Input keyboardType="numeric" placeholder="Days" value={durationDays} onChangeText={setDurationDays} />
              </View>
              <Input placeholder="Acceptance criteria" value={acceptanceCriteria} onChangeText={setAcceptanceCriteria} />
              <Pressable disabled={createMutation.isPending} onPress={() => createMutation.mutate()} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, paddingVertical: 13 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createMutation.isPending ? "Creating..." : "Create milestone"}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat label="Milestones" value={milestones.length} />
              <Stat label="Budget planned" value={`${totalBudget}%`} />
            </View>

            {milestonesQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
            {milestones.length === 0 && !milestonesQuery.isLoading ? <Empty text="No milestones yet for this project." /> : null}
            {milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                loading={submitMutation.isPending}
                onSubmit={() => submitMutation.mutate(milestone.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
              borderRadius: 8,
              borderWidth: 1,
              maxWidth: 220,
              padding: 12,
            }}
          >
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{project.name}</Text>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{project.status}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MilestoneCard({ milestone, loading, onSubmit }: { milestone: EngineerMilestone; loading: boolean; onSubmit: () => void }) {
  const canSubmit = ["pending", "active", "revision_required"].includes(milestone.status);
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons name="flag-outline" size={22} color={COLORS.PRIMARY} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>{milestone.name}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
            {milestone.budgetPercentage}% budget • {milestone._count?.boqItems || 0} BOQ items
          </Text>
        </View>
        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>{milestone.status}</Text>
      </View>
      {milestone.acceptanceCriteria ? (
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 10 }}>{milestone.acceptanceCriteria}</Text>
      ) : null}
      {canSubmit ? (
        <Pressable disabled={loading} onPress={onSubmit} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, marginTop: 12, paddingVertical: 12 }}>
          <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>{loading ? "Sending..." : "Send to supervisor"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Input(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      style={{
        backgroundColor: COLORS.MUTED,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 8,
        borderWidth: 1,
        color: COLORS.TEXT_PRIMARY,
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    />
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flex: 1, padding: 14 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
