import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerAssignment } from "@/components/engineer/engineer-types";

export default function EngineerAssignments() {
  const queryClient = useQueryClient();
  const assignmentsQuery = useQuery({
    queryKey: ["engineer-assignments"],
    queryFn: async () => {
      const response = await api.get<EngineerAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST);
      return response.data.filter((assignment) => assignment.role?.toLowerCase() === "engineer");
    },
    refetchOnMount: "always",
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      const endpoint =
        action === "accept"
          ? ENDPOINTS.PROJECT_MEMBERS.ACCEPT(id)
          : ENDPOINTS.PROJECT_MEMBERS.REJECT(id);
      return api.post(endpoint);
    },
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-assignments"] }),
        queryClient.refetchQueries({ queryKey: ["engineer-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-boq-items"] }),
      ]);
      Alert.alert(
        variables.action === "accept" ? "Project accepted" : "Project declined",
        variables.action === "accept"
          ? "The project is now available for milestones and BOQ."
          : "The client will see that you declined the assignment.",
      );
    },
    onError: (error) => Alert.alert("Action failed", error instanceof Error ? error.message : "Try again."),
  });

  const assignments = assignmentsQuery.data || [];
  const pending = assignments.filter((assignment) => assignment.status === "pending");
  const history = assignments.filter((assignment) => assignment.status !== "pending");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <Header title="Project assignments" subtitle="Accept assigned client projects before creating milestones or BOQ." />

        {assignmentsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : (
          <>
            <SectionTitle title="Pending invitations" count={pending.length} />
            {pending.length === 0 ? <Empty text="No pending engineer invitations." /> : null}
            {pending.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                loading={respondMutation.isPending}
                onAccept={() => respondMutation.mutate({ id: assignment.id, action: "accept" })}
                onReject={() => respondMutation.mutate({ id: assignment.id, action: "reject" })}
              />
            ))}

            <SectionTitle title="Assignment history" count={history.length} />
            {history.length === 0 ? <Empty text="Accepted and declined assignments will appear here." /> : null}
            {history.map((assignment) => (
              <HistoryCard key={assignment.id} assignment={assignment} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
    </View>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{title}</Text>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "900" }}>{count}</Text>
    </View>
  );
}

function AssignmentCard({
  assignment,
  loading,
  onAccept,
  onReject,
}: {
  assignment: EngineerAssignment;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.PRIMARY, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>ENGINEER INVITATION</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 6 }}>
        {assignment.project?.name || "Assigned project"}
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
        {assignment.project?.address || assignment.project?.description || "Client is requesting engineering work."}
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Pressable disabled={loading} onPress={onReject} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, paddingVertical: 12 }}>
          <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
        </Pressable>
        <Pressable disabled={loading} onPress={onAccept} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, paddingVertical: 12 }}>
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{loading ? "Saving..." : "Accept"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HistoryCard({ assignment }: { assignment: EngineerAssignment }) {
  const accepted = assignment.status === "accepted";
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 14 }}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
        <Ionicons name={accepted ? "checkmark-circle-outline" : "close-circle-outline"} size={22} color={accepted ? COLORS.SUCCESS : COLORS.TEXT_LIGHT} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{assignment.project?.name || "Project"}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 2 }}>{assignment.status}</Text>
        </View>
      </View>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
