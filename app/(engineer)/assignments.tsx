import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerAssignment } from "@/components/engineer/engineer-types";

export default function EngineerAssignments() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<EngineerAssignment | null>(null);
  const assignmentsQuery = useQuery({
    queryKey: ["engineer-assignments"],
    queryFn: async () => {
      const response = await api.get<EngineerAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST);
      return response.data.filter((assignment) => assignment.role?.toLowerCase() === "engineer");
    },
    refetchOnMount: "always",
    refetchInterval: 10000,
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
      setSelectedAssignment(null);
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
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={assignmentsQuery.isRefetching} onRefresh={assignmentsQuery.refetch} tintColor={COLORS.PRIMARY} />}
      >
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
                onOpen={() => setSelectedAssignment(assignment)}
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
      <AssignmentDetailSheet
        assignment={selectedAssignment}
        loading={respondMutation.isPending}
        visible={Boolean(selectedAssignment)}
        onAccept={() => selectedAssignment && respondMutation.mutate({ id: selectedAssignment.id, action: "accept" })}
        onClose={() => setSelectedAssignment(null)}
        onReject={() => selectedAssignment && respondMutation.mutate({ id: selectedAssignment.id, action: "reject" })}
      />
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
  onOpen,
}: {
  assignment: EngineerAssignment;
  loading: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable onPress={onOpen} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.PRIMARY, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>ENGINEER INVITATION</Text>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 6 }}>
        {assignment.project?.name || "Assigned project"}
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
        {assignment.project?.address || assignment.project?.description || "Client is requesting engineering work."}
      </Text>
      <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 14, paddingVertical: 12 }}>
        <Ionicons name="document-text-outline" size={18} color={COLORS.PRIMARY_DARK} />
        <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>{loading ? "Saving..." : "View full details"}</Text>
      </View>
    </Pressable>
  );
}

function AssignmentDetailSheet({
  assignment,
  visible,
  loading,
  onClose,
  onAccept,
  onReject,
}: {
  assignment: EngineerAssignment | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!assignment?.project) return null;
  const project = assignment.project;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <SheetHeader label="ENGINEER INVITATION" title={project.name} onClose={onClose} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <DetailBlock>
              <InfoLine label="Status" value={project.status} />
              <InfoLine label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency || "RWF"}`} />
              <InfoLine label="Location" value={project.address || "Not provided"} />
              <InfoLine label="Client" value={project.client?.name || project.client?.email || "Client"} />
            </DetailBlock>
            <DetailSection title="Description" body={project.description || "No description provided."} />
            <DetailSection title="Scope" body={`${project.milestones?.length || 0} milestone(s) currently created. Accept to manage milestones, BOQ, RFQs, and progress.`} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable disabled={loading} onPress={onReject} style={styles.rejectButton}>
                <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
              </Pressable>
              <Pressable disabled={loading} onPress={onAccept} style={[styles.acceptButton, loading && { opacity: 0.7 }]}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{loading ? "Saving..." : "Accept"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

function SheetHeader({ label, title, onClose }: { label: string; title: string; onClose: () => void }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sheetEyebrow}>{label}</Text>
        <Text style={styles.sheetTitle}>{title}</Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={COLORS.TEXT_PRIMARY} />
      </Pressable>
    </View>
  );
}

function DetailBlock({ children }: { children: ReactNode }) {
  return <View style={styles.detailBlock}>{children}</View>;
}

function DetailSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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

const styles = {
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  sheetScrim: {
    backgroundColor: "rgba(15,23,42,0.45)",
    bottom: 0,
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%" as const,
    padding: 18,
    paddingBottom: 0,
  },
  sheetHandle: {
    alignSelf: "center" as const,
    backgroundColor: COLORS.BORDER,
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 44,
  },
  sheetEyebrow: {
    color: COLORS.PRIMARY,
    fontSize: 10,
    fontWeight: "900" as const,
  },
  sheetTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 3,
  },
  closeButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 999,
    height: 36,
    justifyContent: "center" as const,
    width: 36,
  },
  detailBlock: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  infoLine: {
    alignItems: "center" as const,
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    flexDirection: "row" as const,
    gap: 10,
    justifyContent: "space-between" as const,
    paddingVertical: 9,
  },
  infoLabel: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  infoValue: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 12,
    fontWeight: "900" as const,
    textAlign: "right" as const,
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  sectionBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  rejectButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  acceptButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
};
