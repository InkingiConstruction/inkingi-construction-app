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

export default function AssignSupervisor() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(params.projectId || "");
  const [supervisorId, setSupervisorId] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<ClientProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });
  const supervisorsQuery = useQuery({
    queryKey: ["client-supervisors"],
    queryFn: async () => (await api.get<ClientUser[]>(ENDPOINTS.USERS.SUPERVISORS)).data,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !supervisorId) throw new Error("Choose a project and supervisor first.");
      return api.post(ENDPOINTS.PROJECT_MEMBERS.CREATE, {
        projectId,
        userId: supervisorId,
        role: "supervisor",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      Alert.alert("Supervisor invited", "The supervisor can now inspect this project.");
    },
    onError: (error) => Alert.alert("Assignment failed", error instanceof Error ? error.message : "Try again."),
  });

  const projects = projectsQuery.data || [];
  const supervisors = supervisorsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Assign Supervisor"
          subtitle="Add the supervisor who will inspect milestones and validate progress."
        />

        {projectsQuery.isLoading || supervisorsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <Section title="Project">
              {projects.map((project) => {
                const supervisor = project.projectMembers?.find(
                  (member) => member.role === "supervisor" && member.status === "accepted",
                );
                return (
                  <Choice
                    key={project.id}
                    active={projectId === project.id}
                    title={project.name}
                    subtitle={supervisor?.user?.name ? `Current supervisor: ${supervisor.user.name}` : "No supervisor accepted yet"}
                    icon="business-outline"
                    onPress={() => setProjectId(project.id)}
                  />
                );
              })}
              {projects.length === 0 ? <Empty text="Create a project before assigning a supervisor." /> : null}
            </Section>

            <Section title="Supervisors">
              {supervisors.map((supervisor) => (
                <Choice
                  key={supervisor.id}
                  active={supervisorId === supervisor.id}
                  title={supervisor.name || supervisor.email || "Supervisor"}
                  subtitle={`${supervisor.email || "No email"} • ${supervisor.kycStatus || "kyc pending"}`}
                  icon="shield-checkmark-outline"
                  onPress={() => setSupervisorId(supervisor.id)}
                />
              ))}
              {supervisors.length === 0 ? <Empty text="No supervisor accounts found from the backend." /> : null}
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
                {assignMutation.isPending ? "Sending invitation..." : "Send supervisor invitation"}
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
