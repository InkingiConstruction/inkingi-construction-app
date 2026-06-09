import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type Project = { id: string; name: string; status: string };
type InventoryLog = {
  id: string;
  material: string;
  unit?: string | null;
  quantity: string | number;
  direction: string;
  createdAt: string;
};

export default function SiteAgentInventory() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(params.projectId || "");
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: ["site-agent-projects"],
    queryFn: async () => (await api.get<Project[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });
  const projects = projectsQuery.data || [];
  const activeProjects = projects.filter((project) => project.status === "active");
  const activeProject =
    activeProjects.find((project) => project.id === selectedProjectId) ||
    activeProjects[0];

  useEffect(() => {
    if (!selectedProjectId && activeProjects[0]?.id) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [activeProjects, selectedProjectId]);
  const logsQuery = useQuery({
    enabled: Boolean(activeProject?.id),
    queryKey: ["site-agent-inventory-logs", activeProject?.id],
    queryFn: async () =>
      (
        await api.get<InventoryLog[]>(ENDPOINTS.SITE_AGENT.INVENTORY_LOGS, {
          params: { projectId: activeProject?.id },
        })
      ).data,
  });
  const logs = logsQuery.data || [];

  const createLog = useMutation({
    mutationFn: async () =>
      api.post(ENDPOINTS.SITE_AGENT.INVENTORY_LOGS, {
        projectId: activeProject?.id,
        material,
        quantity: Number(quantity),
        unit,
        direction: "consumed",
      }),
    onSuccess: () => {
      setMaterial("");
      setQuantity("");
      setUnit("");
      queryClient.invalidateQueries({ queryKey: ["site-agent-inventory-logs", activeProject?.id] });
      Alert.alert("Stock logged", "Material consumption has been saved.");
    },
    onError: (error: any) => {
      Alert.alert("Submission failed", error?.response?.data?.message || "Could not log stock usage.");
    },
  });

  const logUse = () => {
    if (!activeProject) {
      Alert.alert("No active project", "You need an active assigned project before logging stock.");
      return;
    }
    if (!material.trim() || !quantity.trim()) {
      Alert.alert("Missing stock data", "Please enter material and quantity consumed.");
      return;
    }
    createLog.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "900" }}>INVENTORY TRACKING</Text>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>Site Stock</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 4 }}>
          Track daily consumption against BOQ materials and milestone stock levels.
        </Text>
        <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, marginTop: 16, padding: 12 }}>
          {projectsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : (
            <>
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>ACTIVE PROJECT</Text>
              {activeProjects.length > 0 ? (
                <View style={{ gap: 8, marginTop: 10 }}>
                  {activeProjects.map((project) => (
                    <Pressable
                      key={project.id}
                      onPress={() => setSelectedProjectId(project.id)}
                      style={{
                        backgroundColor: activeProject?.id === project.id ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
                        borderColor: activeProject?.id === project.id ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                        borderRadius: 8,
                        borderWidth: 1,
                        padding: 11,
                      }}
                    >
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{project.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "900", marginTop: 3 }}>
                  No active project assigned
                </Text>
              )}
            </>
          )}
        </View>

        <View style={{ gap: 10, marginTop: 20 }}>
          {logs.slice(0, 6).map((item) => (
            <View key={item.id} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 }}>
              <View>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.material}</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  {item.direction}
                </Text>
              </View>
              <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>
                {item.quantity} {item.unit || ""}
              </Text>
            </View>
          ))}
          {logs.length === 0 ? (
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>No stock movement logged yet.</Text>
          ) : null}
        </View>

        <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 18, padding: 16 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>Log consumption</Text>
          <TextInput value={material} onChangeText={setMaterial} placeholder="Material name" placeholderTextColor={COLORS.TEXT_LIGHT} style={{ backgroundColor: COLORS.MUTED, borderRadius: 10, color: COLORS.TEXT_PRIMARY, padding: 13 }} />
          <TextInput value={quantity} onChangeText={setQuantity} placeholder="Quantity used today" placeholderTextColor={COLORS.TEXT_LIGHT} keyboardType="numeric" style={{ backgroundColor: COLORS.MUTED, borderRadius: 10, color: COLORS.TEXT_PRIMARY, padding: 13 }} />
          <TextInput value={unit} onChangeText={setUnit} placeholder="Unit, e.g. bags, pcs, m3" placeholderTextColor={COLORS.TEXT_LIGHT} style={{ backgroundColor: COLORS.MUTED, borderRadius: 10, color: COLORS.TEXT_PRIMARY, padding: 13 }} />
          <Pressable disabled={createLog.isPending} onPress={logUse} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 10, flexDirection: "row", gap: 8, justifyContent: "center", opacity: createLog.isPending ? 0.65 : 1, paddingVertical: 14 }}>
            <Ionicons name="remove-circle-outline" size={18} color={COLORS.TEXT_WHITE} />
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {createLog.isPending ? "Saving..." : "Log Material Use"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
