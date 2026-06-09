import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type Project = { id: string; name: string; status: string };

export default function SiteAgentReceiving() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [deliveryCode, setDeliveryCode] = useState("");
  const [pin, setPin] = useState("");
  const [remarks, setRemarks] = useState("");
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

  const createVerification = useMutation({
    mutationFn: async () =>
      api.post(ENDPOINTS.SITE_AGENT.DELIVERY_VERIFICATIONS, {
        projectId: activeProject?.id,
        deliveryCode,
        pin,
        remarks,
      }),
    onSuccess: () => {
      setDeliveryCode("");
      setPin("");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["site-agent-delivery-verifications"] });
      Alert.alert("Delivery confirmed", "Delivery verification has been saved.");
    },
    onError: (error: any) => {
      Alert.alert("Verification failed", error?.response?.data?.message || "Could not verify delivery.");
    },
  });

  const verify = () => {
    if (!activeProject) {
      Alert.alert("No active project", "You need an active assigned project before verifying deliveries.");
      return;
    }
    if (!deliveryCode.trim() || pin.trim().length !== 6) {
      Alert.alert("Missing verification", "Enter the delivery reference and 6-digit receiving PIN.");
      return;
    }
    createVerification.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching}
            onRefresh={projectsQuery.refetch}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, height: 38, justifyContent: "center", width: 38 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.PRIMARY_DARK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "900" }}>MATERIAL RECEIVING</Text>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>Verify Delivery</Text>
          </View>
        </View>
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 8 }}>
          Confirm supplier materials with delivery reference, secure PIN, and condition notes.
        </Text>
        <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, marginTop: 16, padding: 12 }}>
          {projectsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : (
            <>
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>RECEIVING PROJECT</Text>
              {activeProject ? (
                <View style={{ alignItems: "center", flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 9, height: 38, justifyContent: "center", width: 38 }}>
                    <Ionicons name="cube-outline" size={18} color={COLORS.PRIMARY_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{activeProject.name}</Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 2 }}>Delivery verification will be linked to this project.</Text>
                  </View>
                </View>
              ) : null}
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

        <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 20, padding: 16 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>Delivery confirmation</Text>
          <Input label="Delivery reference" value={deliveryCode} onChangeText={setDeliveryCode} placeholder="PO number, waybill, or supplier code" />
          <Input
            label="Receiving PIN"
            value={pin}
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="6 digits"
            keyboardType="numeric"
            pin
          />
          <Input
            label="Condition notes"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Missing, damaged, incorrect items, or delivery notes"
            multiline
          />

          <Pressable style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderColor: COLORS.PRIMARY, borderRadius: 12, borderStyle: "dashed", borderWidth: 1, gap: 8, padding: 18 }}>
            <Ionicons name="camera-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>Capture receipt photo</Text>
          </Pressable>

          <Pressable disabled={createVerification.isPending} onPress={verify} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 10, flexDirection: "row", gap: 8, justifyContent: "center", opacity: createVerification.isPending ? 0.65 : 1, paddingVertical: 14 }}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.TEXT_WHITE} />
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {createVerification.isPending ? "Confirming..." : "Confirm Delivery"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  pin?: boolean;
}) {
  return (
    <View>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "900", marginBottom: 7 }}>
        {props.label}
      </Text>
      <TextInput
        keyboardType={props.keyboardType || "default"}
        multiline={props.multiline}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{
          backgroundColor: COLORS.MUTED,
          borderColor: COLORS.BORDER_LIGHT,
          borderRadius: 10,
          borderWidth: 1,
          color: COLORS.TEXT_PRIMARY,
          fontSize: props.pin ? 20 : 14,
          fontWeight: props.pin ? "900" : "700",
          letterSpacing: props.pin ? 4 : 0,
          minHeight: props.multiline ? 90 : undefined,
          padding: 13,
          textAlign: props.pin ? "center" : "left",
          textAlignVertical: props.multiline ? "top" : "center",
        }}
        value={props.value}
      />
    </View>
  );
}
