import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientProject } from "@/components/client/client-types";
import { COLORS } from "@/constants/colors";

export default function ClientProjects() {
  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<ClientProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
  });

  const projects = projectsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Projects"
          subtitle="Manage each project as a workspace: people, progress, and payments."
        />

        <Pressable
          onPress={() => router.push("/(client)/create-project")}
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY,
            borderRadius: 8,
            flexDirection: "row",
            gap: 8,
            justifyContent: "center",
            marginBottom: 16,
            paddingVertical: 14,
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.TEXT_WHITE} />
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Create new project</Text>
        </Pressable>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 70 }} />
        ) : (
          <View style={{ gap: 14 }}>
            {projects.map((project) => {
              const supervisor = project.projectMembers?.find(
                (member) => member.role === "supervisor" && member.status === "accepted",
              );
              const pending = project.projectMembers?.filter((member) => member.status === "pending") || [];

              return (
                <View
                  key={project.id}
                  style={{
                    backgroundColor: COLORS.SURFACE,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderRadius: 10,
                    borderWidth: 1,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View
                        style={{
                          alignItems: "center",
                          backgroundColor: COLORS.PRIMARY_LIGHT,
                          borderRadius: 8,
                          height: 46,
                          justifyContent: "center",
                          width: 46,
                        }}
                      >
                        <Ionicons name="business-outline" size={23} color={COLORS.PRIMARY_DARK} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>
                          {project.name}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                          {project.address || "No address set"}
                        </Text>
                      </View>
                      <StatusBadge value={project.status} />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                      <Mini label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency}`} />
                      <Mini label="Milestones" value={`${project.milestones?.length || 0}`} />
                    </View>

                    <View style={{ gap: 9, marginTop: 14 }}>
                      <TeamLine
                        icon="construct-outline"
                        label="Engineer"
                        value={project.engineer?.name || "Not assigned"}
                        state={project.engineer ? "Accepted" : pending.find((item) => item.role === "engineer") ? "Pending" : "Missing"}
                      />
                      <TeamLine
                        icon="shield-checkmark-outline"
                        label="Supervisor"
                        value={supervisor?.user?.name || "Not assigned"}
                        state={supervisor ? "Accepted" : pending.find((item) => item.role === "supervisor") ? "Pending" : "Missing"}
                      />
                    </View>
                  </View>

                  <View
                    style={{
                      borderColor: COLORS.BORDER_LIGHT,
                      borderTopWidth: 1,
                      flexDirection: "row",
                    }}
                  >
                    <Action
                      icon="construct-outline"
                      label="Engineer"
                      onPress={() =>
                        router.push({
                          pathname: "/(client)/assign-engineer",
                          params: { projectId: project.id },
                        })
                      }
                    />
                    <Action
                      icon="shield-checkmark-outline"
                      label="Supervisor"
                      onPress={() =>
                        router.push({
                          pathname: "/(client)/assign-supervisor",
                          params: { projectId: project.id },
                        })
                      }
                    />
                    <Action icon="trending-up-outline" label="Progress" onPress={() => router.push("/(client)/progress")} />
                    <Action icon="card-outline" label="Pay" onPress={() => router.push("/(client)/payments")} />
                  </View>
                </View>
              );
            })}

            {projects.length === 0 ? (
              <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>No project yet</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6 }}>
                  Create a project first. After that you can assign an engineer and supervisor from the project card.
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 }}>
      <Text style={{ color: COLORS.PRIMARY, fontSize: 11, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, padding: 11 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label.toUpperCase()}</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function TeamLine({ icon, label, value, state }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; state: string }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
      <Ionicons name={icon} size={18} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_SECONDARY, flex: 1, fontSize: 13 }}>
        {label}: <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{value}</Text>
      </Text>
      <Text style={{ color: state === "Accepted" ? COLORS.SUCCESS : COLORS.WARNING, fontSize: 11, fontWeight: "900" }}>
        {state}
      </Text>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", flex: 1, gap: 4, paddingVertical: 12 }}>
      <Ionicons name={icon} size={18} color={COLORS.PRIMARY} />
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}
