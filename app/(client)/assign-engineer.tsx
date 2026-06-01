import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientProject, ClientUser } from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function AssignEngineer() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(params.projectId || "");
  const [engineerId, setEngineerId] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<ClientProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });
  const engineersQuery = useQuery({
    queryKey: ["client-engineers"],
    queryFn: async () => (await api.get<ClientUser[]>(ENDPOINTS.USERS.ENGINEERS)).data,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !engineerId) throw new Error("Choose a project and engineer first.");
      return api.post(ENDPOINTS.PROJECT_MEMBERS.CREATE, {
        projectId,
        userId: engineerId,
        role: "engineer",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      Alert.alert("Invitation sent", "The engineer can now accept or reject this project.");
    },
    onError: (error) => Alert.alert("Assignment failed", error instanceof Error ? error.message : "Try again."),
  });

  const projects = projectsQuery.data || [];
  const engineers = engineersQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Assign Engineer"
          subtitle="Pick the project and invite the engineer who will build the milestones and BOQ."
        />

        {projectsQuery.isLoading || engineersQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <Section title="Project">
              {projects.map((project) => (
                <Choice
                  key={project.id}
                  active={projectId === project.id}
                  title={project.name}
                  subtitle={project.engineer?.name ? `Current engineer: ${project.engineer.name}` : "No engineer accepted yet"}
                  icon="business-outline"
                  onPress={() => setProjectId(project.id)}
                />
              ))}
              {projects.length === 0 ? <Empty text="Create a project before assigning an engineer." /> : null}
            </Section>

            <Section title="Engineers">
              {engineers.map((engineer) => (
                <Choice
                  key={engineer.id}
                  active={engineerId === engineer.id}
                  title={engineer.name || engineer.email || "Engineer"}
                  subtitle={`${engineer.email || "No email"} • ${engineer.kycStatus || "kyc pending"}`}
                  icon="construct-outline"
                  onPress={() => setEngineerId(engineer.id)}
                />
              ))}
              {engineers.length === 0 ? <Empty text="No engineer accounts found from the backend." /> : null}
            </Section>

            <Pressable
              disabled={assignMutation.isPending}
              onPress={() => assignMutation.mutate()}
              style={{
                alignItems: "center",
                backgroundColor: assignMutation.isPending ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                borderRadius: 8,
                flexDirection: "row",
                gap: 8,
                justifyContent: "center",
                paddingVertical: 15,
              }}
            >
              {assignMutation.isPending ? <ActivityIndicator color={COLORS.TEXT_WHITE} /> : <Ionicons name="send" size={18} color={COLORS.TEXT_WHITE} />}
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                {assignMutation.isPending ? "Sending invitation..." : "Send engineer invitation"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Choice({ active, title, subtitle, icon, onPress }: { active: boolean; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: active ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
        borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        padding: 13,
      }}
    >
      <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
      </View>
      {active ? <Ionicons name="checkmark-circle" size={20} color={COLORS.PRIMARY} /> : null}
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>;
}
