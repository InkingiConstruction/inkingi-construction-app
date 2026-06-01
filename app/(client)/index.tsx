import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import {
  ClientEscrowAccount,
  ClientMilestone,
  ClientProgressPhoto,
  ClientProject,
} from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function ClientIndex() {
  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<ClientProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
  });
  const milestonesQuery = useQuery({
    queryKey: ["client-milestones"],
    queryFn: async () => (await api.get<ClientMilestone[]>(ENDPOINTS.MILESTONES.LIST)).data,
  });
  const progressQuery = useQuery({
    queryKey: ["client-progress-photos"],
    queryFn: async () => (await api.get<ClientProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST)).data,
  });
  const escrowQuery = useQuery({
    queryKey: ["client-escrow-accounts"],
    queryFn: async () => (await api.get<ClientEscrowAccount[]>(ENDPOINTS.ESCROW_ACCOUNTS.LIST)).data,
  });

  const projects = projectsQuery.data || [];
  const milestones = milestonesQuery.data || [];
  const progress = progressQuery.data || [];
  const escrows = escrowQuery.data || [];
  const activeProjects = projects.filter((project) => !["completed", "cancelled"].includes(project.status));
  const awaitingPayments = milestones.filter((milestone) => milestone.status === "awaiting_client_payment");
  const withoutEngineer = projects.filter((project) => !project.engineerId);
  const loading = projectsQuery.isLoading || milestonesQuery.isLoading;
  const totalEscrow = escrows.reduce((sum, escrow) => sum + Number(escrow.balance || 0), 0);

  const nextProject = withoutEngineer[0] || activeProjects[0] || projects[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Dashboard"
          subtitle="A clean control room for projects, teams, progress, and escrow."
        />

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, overflow: "hidden" }}>
              <View style={{ padding: 18 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900", opacity: 0.75 }}>
                  NEXT CLIENT ACTION
                </Text>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 24, fontWeight: "900", marginTop: 8 }}>
                  {nextProject ? nextProject.name : "Create your first project"}
                </Text>
                <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                  {withoutEngineer[0]
                    ? "Assign an engineer so work can move from planning into execution."
                    : awaitingPayments[0]
                      ? "A milestone is approved and waiting for client payment release."
                      : nextProject
                        ? "Open the project workspace to manage team and progress."
                        : "Start with the project brief, location, budget, and site photos."}
                </Text>
                <Pressable
                  onPress={() => {
                    if (!nextProject) return router.push("/(client)/create-project");
                    if (withoutEngineer[0]) {
                      return router.push({
                        pathname: "/(client)/assign-engineer",
                        params: { projectId: withoutEngineer[0].id },
                      });
                    }
                    if (awaitingPayments[0]) return router.push("/(client)/payments");
                    return router.push("/(client)/projects");
                  }}
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 8,
                    flexDirection: "row",
                    gap: 8,
                    justifyContent: "center",
                    marginTop: 16,
                    paddingVertical: 13,
                  }}
                >
                  <Ionicons name="arrow-forward" size={18} color={COLORS.TEXT_WHITE} />
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Continue</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric label="Projects" value={projects.length} icon="business-outline" />
              <Metric label="Active" value={activeProjects.length} icon="hammer-outline" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Metric label="Pay Review" value={awaitingPayments.length} icon="card-outline" />
              <Metric label="Updates" value={progress.length} icon="images-outline" />
            </View>

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>Portfolio</Text>
                <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>
                  {totalEscrow.toLocaleString()} RWF
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {projects.slice(0, 4).map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => router.push("/(client)/projects")}
                    style={{
                      backgroundColor: COLORS.MUTED,
                      borderRadius: 8,
                      flexDirection: "row",
                      gap: 12,
                      padding: 13,
                    }}
                  >
                    <View
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.PRIMARY_LIGHT,
                        borderRadius: 7,
                        height: 38,
                        justifyContent: "center",
                        width: 38,
                      }}
                    >
                      <Ionicons name="business" size={18} color={COLORS.PRIMARY_DARK} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{project.name}</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>
                        {project.engineer?.name || "Engineer not assigned"} • {project.status}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.TEXT_LIGHT} />
                  </Pressable>
                ))}
                {projects.length === 0 ? (
                  <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
                    No projects yet. Create one and the full workflow will appear here.
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, flex: 1, padding: 16 }}>
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900", marginTop: 10 }}>{value}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}
