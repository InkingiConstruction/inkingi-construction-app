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
import { EngineerMilestone, EngineerProject, EngineerRfq } from "@/components/engineer/engineer-types";

export default function EngineerRfqs() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");

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
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId: activeProjectId } })).data,
  });

  const milestones = milestonesQuery.data || [];
  const activeMilestoneId = selectedMilestoneId || milestones[0]?.id || "";

  const rfqsQuery = useQuery({
    queryKey: ["engineer-rfqs", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => (await api.get<EngineerRfq[]>(ENDPOINTS.RFQS.LIST, { params: { projectId: activeProjectId } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectId || !activeMilestoneId) throw new Error("Select a project and milestone first.");
      if (!title.trim() || !quantity.trim() || !unit.trim() || !deadline.trim()) {
        throw new Error("Title, quantity, unit, and deadline are required.");
      }
      return api.post(ENDPOINTS.RFQS.CREATE, {
        projectId: activeProjectId,
        milestoneId: activeMilestoneId,
        title: title.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        deadline: new Date(deadline).toISOString(),
      });
    },
    onSuccess: async () => {
      setTitle("");
      setQuantity("");
      setUnit("");
      setDeadline("");
      await queryClient.refetchQueries({ queryKey: ["engineer-rfqs", activeProjectId] });
      Alert.alert("RFQ published", "Suppliers can now submit quotes.");
    },
    onError: (error) => Alert.alert("RFQ failed", error instanceof Error ? error.message : "Try again."),
  });

  const rfqs = rfqsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>RFQs</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Publish supplier quote requests from project milestones.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty text="No accepted engineer projects found." />
        ) : (
          <>
            <Selector items={projects.map((project) => ({ id: project.id, title: project.name, subtitle: project.status }))} activeId={activeProjectId} onSelect={(id) => {
              setSelectedProjectId(id);
              setSelectedMilestoneId("");
            }} />
            <Selector items={milestones.map((milestone) => ({ id: milestone.id, title: milestone.name, subtitle: milestone.status }))} activeId={activeMilestoneId} onSelect={setSelectedMilestoneId} emptyText="Create a milestone before publishing RFQs." />

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16, gap: 10 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>New RFQ</Text>
              <Input placeholder="Request title" value={title} onChangeText={setTitle} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Input keyboardType="numeric" placeholder="Quantity" value={quantity} onChangeText={setQuantity} />
                <Input placeholder="Unit" value={unit} onChangeText={setUnit} />
              </View>
              <Input placeholder="Deadline, e.g. 2026-06-20" value={deadline} onChangeText={setDeadline} />
              <Pressable disabled={createMutation.isPending} onPress={() => createMutation.mutate()} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, paddingVertical: 13 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createMutation.isPending ? "Publishing..." : "Publish RFQ"}</Text>
              </Pressable>
            </View>

            {rfqsQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
            {rfqs.length === 0 && !rfqsQuery.isLoading ? <Empty text="No RFQs yet for this project." /> : null}
            {rfqs.map((rfq) => <RfqCard key={rfq.id} rfq={rfq} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Selector({
  items,
  activeId,
  onSelect,
  emptyText,
}: {
  items: { id: string; title: string; subtitle?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0) return <Empty text={emptyText || "Nothing to select yet."} />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable key={item.id} onPress={() => onSelect(item.id)} style={{ backgroundColor: active ? COLORS.PRIMARY : COLORS.SURFACE, borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, maxWidth: 230, padding: 12 }}>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.title}</Text>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{item.subtitle || "Select"}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function RfqCard({ rfq }: { rfq: EngineerRfq }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons name="receipt-outline" size={22} color={COLORS.PRIMARY} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{rfq.title}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
            {rfq.quantity} {rfq.unit} • {rfq.quotes?.length || 0} quotes
          </Text>
        </View>
        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>{rfq.status}</Text>
      </View>
    </View>
  );
}

function Input(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      style={{ backgroundColor: COLORS.MUTED, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, color: COLORS.TEXT_PRIMARY, flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}
    />
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
