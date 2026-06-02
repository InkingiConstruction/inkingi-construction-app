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
import { EngineerBoqItem, EngineerMilestone, EngineerProject } from "@/components/engineer/engineer-types";

export default function EngineerBoq() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [category, setCategory] = useState("Materials");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");

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
  const activeMilestoneId = selectedMilestoneId || milestones[0]?.id || "";

  const boqQuery = useQuery({
    queryKey: ["engineer-boq-items", activeMilestoneId],
    enabled: Boolean(activeMilestoneId),
    queryFn: async () => {
      const response = await api.get<EngineerBoqItem[]>(ENDPOINTS.BOQ_ITEMS.LIST, {
        params: { milestoneId: activeMilestoneId },
      });
      return response.data;
    },
  });

  const boqItems = boqQuery.data || [];
  const total = boqItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeMilestoneId) throw new Error("Select a milestone first.");
      if (!category.trim() || !name.trim() || !quantity.trim() || !unit.trim() || !unitPrice.trim()) {
        throw new Error("Category, name, quantity, unit, and unit price are required.");
      }
      return api.post(ENDPOINTS.BOQ_ITEMS.CREATE, {
        milestoneId: activeMilestoneId,
        category: category.trim(),
        name: name.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        unitPrice: Number(unitPrice),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setName("");
      setQuantity("");
      setUnit("");
      setUnitPrice("");
      setNotes("");
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-boq-items", activeMilestoneId] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] }),
      ]);
      Alert.alert("BOQ item added", "The line item was added to this milestone.");
    },
    onError: (error) => Alert.alert("Create failed", error instanceof Error ? error.message : "Try again."),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!activeMilestoneId) throw new Error("Select a milestone first.");
      return api.put(ENDPOINTS.MILESTONES.DETAIL(activeMilestoneId), { status: "pending_supervisor" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] });
      Alert.alert("BOQ sent", "The milestone and BOQ items are now waiting for supervisor review.");
    },
    onError: (error) => Alert.alert("Submit failed", error instanceof Error ? error.message : "Try again."),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>BOQ items</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Add material and labor line items, then send the package to the supervisor.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty text="No accepted engineer projects found. Accept an assignment first." />
        ) : (
          <>
            <ProjectSelector projects={projects} activeProjectId={activeProjectId} onSelect={(id) => {
              setSelectedProjectId(id);
              setSelectedMilestoneId("");
            }} />
            <MilestoneSelector milestones={milestones} activeMilestoneId={activeMilestoneId} onSelect={setSelectedMilestoneId} />

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16, gap: 10 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>New BOQ line</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Input placeholder="Category" value={category} onChangeText={setCategory} />
                <Input placeholder="Unit" value={unit} onChangeText={setUnit} />
              </View>
              <Input placeholder="Item name" value={name} onChangeText={setName} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Input keyboardType="numeric" placeholder="Quantity" value={quantity} onChangeText={setQuantity} />
                <Input keyboardType="numeric" placeholder="Unit price" value={unitPrice} onChangeText={setUnitPrice} />
              </View>
              <Input placeholder="Notes" value={notes} onChangeText={setNotes} />
              <Pressable disabled={createMutation.isPending} onPress={() => createMutation.mutate()} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, paddingVertical: 13 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createMutation.isPending ? "Adding..." : "Add BOQ item"}</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Stat label="Items" value={boqItems.length} />
              <Stat label="Total" value={`${total.toLocaleString()} RWF`} />
            </View>

            <Pressable disabled={!activeMilestoneId || submitMutation.isPending} onPress={() => submitMutation.mutate()} style={{ alignItems: "center", backgroundColor: COLORS.INK, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 13 }}>
              <Ionicons name="send-outline" size={18} color={COLORS.TEXT_WHITE} />
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{submitMutation.isPending ? "Sending..." : "Send milestone and BOQ to supervisor"}</Text>
            </Pressable>

            {boqQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
            {boqItems.length === 0 && !boqQuery.isLoading ? <Empty text="No BOQ items yet for this milestone." /> : null}
            {boqItems.map((item) => <BoqCard key={item.id} item={item} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectSelector({ projects, activeProjectId, onSelect }: { projects: EngineerProject[]; activeProjectId: string; onSelect: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {projects.map((project) => <Choice key={project.id} active={project.id === activeProjectId} title={project.name} subtitle={project.status} onPress={() => onSelect(project.id)} />)}
    </ScrollView>
  );
}

function MilestoneSelector({ milestones, activeMilestoneId, onSelect }: { milestones: EngineerMilestone[]; activeMilestoneId: string; onSelect: (id: string) => void }) {
  if (milestones.length === 0) return <Empty text="Create a milestone before adding BOQ items." />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {milestones.map((milestone) => <Choice key={milestone.id} active={milestone.id === activeMilestoneId} title={milestone.name} subtitle={milestone.status} onPress={() => onSelect(milestone.id)} />)}
    </ScrollView>
  );
}

function Choice({ active, title, subtitle, onPress }: { active: boolean; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: active ? COLORS.PRIMARY : COLORS.SURFACE, borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, maxWidth: 230, padding: 12 }}>
      <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
      <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{subtitle || "Select"}</Text>
    </Pressable>
  );
}

function BoqCard({ item }: { item: EngineerBoqItem }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Ionicons name="cube-outline" size={22} color={COLORS.PRIMARY} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.name}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
            {item.quantity} {item.unit} × {Number(item.unitPrice).toLocaleString()} RWF
          </Text>
        </View>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900" }}>{Number(item.totalPrice).toLocaleString()}</Text>
      </View>
      {item.notes ? <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 10 }}>{item.notes}</Text> : null}
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
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{value}</Text>
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
