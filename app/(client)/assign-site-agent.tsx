import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientProject, ClientUser } from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function AssignSiteAgent() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(params.projectId || "");
  const [siteAgentId, setSiteAgentId] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<ClientProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });
  const siteAgentsQuery = useQuery({
    queryKey: ["client-site-agents"],
    queryFn: async () => (await api.get<ClientUser[]>(ENDPOINTS.USERS.SITE_AGENTS)).data,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !siteAgentId) throw new Error("Choose a project and site agent first.");
      return api.post(ENDPOINTS.PROJECT_MEMBERS.CREATE, {
        projectId,
        userId: siteAgentId,
        role: "site_agent",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      Alert.alert("Site Agent invited", "The Site Agent can now help with delivery verification and daily site reporting.");
    },
    onError: (error) => Alert.alert("Assignment failed", error instanceof Error ? error.message : "Try again."),
  });

  const projects = projectsQuery.data || [];
  const siteAgents = siteAgentsQuery.data || [];
  const refreshing = projectsQuery.isRefetching || siteAgentsQuery.isRefetching;
  const refresh = () => {
    projectsQuery.refetch();
    siteAgentsQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.PRIMARY} />}
      >
        <ClientTopBar
          title="Assign Site Agent"
          subtitle="Invite the trusted on-site user who records daily reports and verifies deliveries."
          back={true}
        />

        {projectsQuery.isLoading || siteAgentsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <Section title="Project">
              {projects.map((project) => {
                const siteAgent = project.projectMembers?.find(
                  (member) => member.role === "site_agent" && member.status === "accepted",
                );
                return (
                  <Choice
                    key={project.id}
                    active={projectId === project.id}
                    title={project.name}
                    subtitle={siteAgent?.user?.name ? `Current Site Agent: ${siteAgent.user.name}` : "No Site Agent accepted yet"}
                    icon="location-outline"
                    onPress={() => setProjectId(project.id)}
                  />
                );
              })}
              {projects.length === 0 ? <Empty text="Create a project before assigning a Site Agent." /> : null}
            </Section>

            <Section title="Site Agents">
              {siteAgents.map((agent) => (
                <Choice
                  key={agent.id}
                  active={siteAgentId === agent.id}
                  title={agent.name || agent.email || "Site Agent"}
                  subtitle={agent.kycStatus || "kyc pending"}
                  icon="person-circle-outline"
                  image={agent.image}
                  onPress={() => setSiteAgentId(agent.id)}
                />
              ))}
              {siteAgents.length === 0 ? <Empty text="No Site Agent accounts found from the backend." /> : null}
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
                {assignMutation.isPending ? "Sending invitation..." : "Send Site Agent invitation"}
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

function Choice({
  active,
  title,
  subtitle,
  icon,
  image,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  image?: string | null;
  onPress: () => void;
}) {
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
        gap: 10,
        padding: 12,
      }}
    >
      <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 20, height: 40, justifyContent: "center", overflow: "hidden", width: 40 }}>
        {image ? (
          <Image source={{ uri: image }} style={{ height: 40, width: 40 }} />
        ) : (
          <Ionicons name={icon} size={20} color={active ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} />
        )}
      </View>
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
