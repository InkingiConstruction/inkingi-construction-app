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
import { useState, useEffect } from "react";
import { PieChart, BarChart } from "react-native-gifted-charts";
import { useSampleFlowStore } from "@/store/sampleFlow.store";
import { getAllFunds, formatRWF } from "@/utils/projectFunds";
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

  const { milestones: storeMilestones, disputes } = useSampleFlowStore();
  const [localEscrows, setLocalEscrows] = useState<any[]>([]);

  useEffect(() => {
    getAllFunds().then(funds => {
      setLocalEscrows(Object.values(funds));
    });
  }, [storeMilestones]);

  const totalEscrow = localEscrows.length > 0 
    ? localEscrows.reduce((sum, escrow) => sum + Number(escrow.balance || 0), 0)
    : escrows.reduce((sum, escrow) => sum + Number(escrow.balance || 0), 0);

  const totalBudget = localEscrows.length > 0
    ? localEscrows.reduce((sum, escrow) => sum + Number(escrow.budget || 0), 0)
    : projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const nextProject = withoutEngineer[0] || activeProjects[0] || projects[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Dashboard"
          // subtitle="A clean control room for projects, teams, progress, and escrow."
        />

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 16 }}>
            {/* <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, overflow: "hidden" }}>
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
            </View> */}

            {/* Metrics Chips Row */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Pressable
                onPress={() => router.push("/(client)/projects")}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 10,
                  flex: 1,
                  minWidth: "40%",
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.PRIMARY_LIGHT, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="business" size={16} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.TEXT_PRIMARY }}>{projects.length}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>Total Projects</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(client)/projects")}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 10,
                  flex: 1,
                  minWidth: "40%",
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="hammer-outline" size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.TEXT_PRIMARY }}>{activeProjects.length}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>Active Projects</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(client)/milestones")}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 10,
                  flex: 1,
                  minWidth: "40%",
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="flag-outline" size={16} color="#D97706" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.TEXT_PRIMARY }}>{awaitingPayments.length}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>Pay Reviews</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(client)/disputes")}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 10,
                  flex: 1,
                  minWidth: "40%",
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.ERROR} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.TEXT_PRIMARY }}>{disputes.length}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>Active Disputes</Text>
                </View>
              </Pressable>
            </View>

            {/* Gifted Charts Visual Dashboard */}
            <View style={{ gap: 16 }}>
              {/* Card 1: Escrow Allocation Pie Chart */}
              <View style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16,
                alignItems: "center"
              }}>
                <Text style={{ alignSelf: "flex-start", fontSize: 13, fontWeight: "900", color: COLORS.TEXT_PRIMARY, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
                  Financial Escrow Status
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: COLORS.PRIMARY }} />
                      <View>
                        <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY }}>Escrow Funds</Text>
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>{formatRWF(totalEscrow)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: COLORS.INK }} />
                      <View>
                        <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY }}>Spent / Budgeted</Text>
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>{formatRWF(Math.max(0, totalBudget - totalEscrow))}</Text>
                      </View>
                    </View>
                  </View>

                  <PieChart
                    data={totalBudget > 0 
                      ? [
                          { value: totalEscrow, color: COLORS.PRIMARY },
                          { value: Math.max(0, totalBudget - totalEscrow), color: COLORS.INK }
                        ]
                      : [
                          { value: 1, color: COLORS.PRIMARY },
                          { value: 0, color: COLORS.INK }
                        ]
                    }
                    donut
                    radius={50}
                    innerRadius={30}
                    innerCircleColor={COLORS.SURFACE}
                    centerLabelComponent={() => (
                      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
                          {totalBudget > 0 ? `${Math.round((totalEscrow / totalBudget) * 100)}%` : "100%"}
                        </Text>
                        <Text style={{ fontSize: 8, color: COLORS.TEXT_SECONDARY }}>Free</Text>
                      </View>
                    )}
                  />
                </View>
              </View>

              {/* Card 2: Activity breakdown Bar Chart */}
              <View style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16,
                alignItems: "center"
              }}>
                <Text style={{ alignSelf: "flex-start", fontSize: 13, fontWeight: "900", color: COLORS.TEXT_PRIMARY, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
                  Portfolio Activity Breakdown
                </Text>
                
                <BarChart
                  data={[
                    { value: projects.length, label: "Projects", frontColor: COLORS.PRIMARY },
                    { value: storeMilestones.length, label: "Milestones", frontColor: "#3B82F6" },
                    { value: disputes.length, label: "Disputes", frontColor: COLORS.ERROR }
                  ]}
                  barWidth={35}
                  barBorderRadius={4}
                  frontColor={COLORS.PRIMARY}
                  noOfSections={3}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor={COLORS.BORDER_LIGHT}
                  hideRules
                  labelWidth={65}
                  height={100}
                  stepValue={2}
                  maxValue={8}
                  yAxisTextStyle={{ color: COLORS.TEXT_SECONDARY, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: COLORS.TEXT_PRIMARY, fontSize: 10, fontWeight: "bold" }}
                />
              </View>
            </View>

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>Recent Projects</Text>
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
                  <View style={{ gap: 12 }}>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
                      No projects yet. Create one and the full workflow will appear here.
                    </Text>
                    <Pressable
                      onPress={() => router.push("/(client)/create-project")}
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.PRIMARY,
                        borderRadius: 8,
                        flexDirection: "row",
                        gap: 8,
                        justifyContent: "center",
                        paddingVertical: 12,
                        marginTop: 4,
                      }}
                    >
                      <Ionicons name="add" size={18} color={COLORS.TEXT_WHITE} />
                      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Create Project</Text>
                    </Pressable>
                  </View>
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
