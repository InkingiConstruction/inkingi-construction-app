import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  address?: string | null;
  client?: { name?: string | null; email?: string | null; image?: string | null } | null;
};

type Assignment = {
  id: string;
  role: string;
  status: string;
  project?: Project | null;
};

export default function SiteAgentDashboard() {
  const assignmentsQuery = useQuery({
    queryKey: ["site-agent-assignments"],
    queryFn: async () => {
      const response = await api.get<Assignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST);
      return response.data.filter((assignment) => assignment.role === "site_agent");
    },
    refetchOnMount: "always",
    refetchInterval: 10000,
  });

  const assignments = assignmentsQuery.data || [];
  const pending = assignments.filter((assignment) => assignment.status === "pending");
  const accepted = assignments.filter((assignment) => assignment.status === "accepted");
  const activeAccepted = accepted.filter((assignment) => assignment.project?.status === "active");
  const nextAssignment = pending[0] || activeAccepted[0] || accepted[0];
  const loading = assignmentsQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={assignmentsQuery.isRefetching}
            onRefresh={() => assignmentsQuery.refetch()}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "900" }}>SITE AGENT PORTAL</Text>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 30, fontWeight: "900" }}>Dashboard</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
            Review assignments, report daily progress, verify deliveries, and control site stock.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 80 }} />
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, overflow: "hidden" }}>
              <View style={{ padding: 18 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900", opacity: 0.72 }}>
                  NEXT SITE ACTION
                </Text>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 25, fontWeight: "900", marginTop: 8 }}>
                  {pending[0]
                    ? "Review project invitation"
                    : nextAssignment?.project
                      ? nextAssignment.project.name
                      : "No site assignment yet"}
                </Text>
                <Text style={{ color: "#CBD5E1", lineHeight: 20, marginTop: 8 }}>
                  {pending[0]
                    ? "Open the invitation to inspect project details before accepting site responsibility."
                    : nextAssignment?.project
                      ? "Open the project sheet to submit reports, track stock, or verify deliveries."
                      : "New project assignments from clients will appear here."}
                </Text>
                <Pressable
                  onPress={() => router.push("/(site-agent)/projects")}
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
                  <Ionicons name={pending[0] ? "document-text-outline" : "briefcase-outline"} size={18} color={COLORS.TEXT_WHITE} />
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                    {pending[0] ? "Review details" : "Open projects"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Metric icon="business-outline" label="Assigned" value={accepted.length} />
              <Metric icon="mail-unread-outline" label="Invites" value={pending.length} tone="#2563EB" />
              <Metric icon="clipboard-outline" label="Reports" value={0} tone="#D97706" />
              <Metric icon="cube-outline" label="Stock tasks" value={0} />
            </View>

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 12, borderWidth: 1, padding: 16 }}>
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>Site workbench</Text>
                <Pressable onPress={() => router.push("/(site-agent)/projects")}>
                  <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900" }}>Projects</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuickAction
                  icon="clipboard-outline"
                  label="Daily report"
                  caption="Capture site facts"
                  onPress={() => router.push("/(site-agent)/projects")}
                />
                <QuickAction
                  icon="keypad-outline"
                  label="Verify delivery"
                  caption="Confirm materials"
                  onPress={() => router.push("/(site-agent)/projects")}
                />
              </View>
            </View>

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 12, borderWidth: 1, padding: 16 }}>
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>Priority queue</Text>
                <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900" }}>{pending.length ? "Needs review" : "Clear"}</Text>
              </View>
              <View style={{ gap: 10 }}>
                {(pending.length ? pending : accepted).slice(0, 3).map((assignment) => (
                  <Pressable
                    key={assignment.id}
                    onPress={() => router.push("/(site-agent)/projects")}
                    style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flexDirection: "row", gap: 10, padding: 12 }}
                  >
                    <Avatar image={assignment.project?.client?.image} name={assignment.project?.client?.name || assignment.project?.client?.email} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }} numberOfLines={1}>
                        {assignment.project?.name || "Assigned project"}
                      </Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                        {assignment.status === "pending" ? "Tap to inspect and accept" : assignment.project?.address || "Open site workflows"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.TEXT_LIGHT} />
                  </Pressable>
                ))}
                {assignments.length === 0 ? (
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>
                    No project invitation has been sent to you yet.
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

function Metric({
  icon,
  label,
  value,
  tone = COLORS.PRIMARY,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Pressable
      onPress={() => router.push("/(site-agent)/projects")}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        flexDirection: "row",
        gap: 10,
        minWidth: "40%",
        padding: 12,
      }}
    >
      <View style={{ alignItems: "center", backgroundColor: `${tone}16`, borderRadius: 16, height: 32, justifyContent: "center", width: 32 }}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <View>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{value}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 10, fontWeight: "800" }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  caption,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, padding: 13 }}>
      <Ionicons name={icon} size={22} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900", marginTop: 12 }}>{label}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 3 }}>{caption}</Text>
    </Pressable>
  );
}

function Avatar({ image, name }: { image?: string | null; name?: string | null }) {
  return (
    <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 18, height: 36, justifyContent: "center", overflow: "hidden", width: 36 }}>
      {image ? (
        <Image source={{ uri: image }} style={{ height: 36, width: 36 }} />
      ) : (
        <Text style={{ color: COLORS.PRIMARY, fontSize: 13, fontWeight: "900" }}>{(name || "C").slice(0, 1).toUpperCase()}</Text>
      )}
    </View>
  );
}
