import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerProject } from "@/components/engineer/engineer-types";
import { isAcceptedEngineerProject } from "@/components/engineer/engineer-utils";

export default function EngineerProjects() {
  const [selectedProject, setSelectedProject] = useState<EngineerProject | null>(null);
  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => {
      const response = await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST);
      return response.data.filter(isAcceptedEngineerProject);
    },
    refetchOnMount: "always",
    refetchInterval: 10000,
  });

  const projects = projectsQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={projectsQuery.isRefetching} onRefresh={projectsQuery.refetch} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>Main Contractor projects</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Accepted projects are ready for milestone planning, BOQ, RFQs, and progress uploads.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty />
        ) : (
          projects.map((project) => <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />)
        )}
      </ScrollView>
      <ProjectDetailSheet
        project={selectedProject}
        visible={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />
    </SafeAreaView>
  );
}

function ProjectCard({ project, onOpen }: { project: EngineerProject; onOpen: () => void }) {
  const milestones = project.milestones || [];
  const supervisor = (project.projectMembers || []).find(
    (member) => member.role?.toLowerCase() === "supervisor" && member.status?.toLowerCase() === "accepted",
  );

  return (
    <Pressable onPress={onOpen} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 10, height: 48, justifyContent: "center", width: 48 }}>
          <Ionicons name="business-outline" size={24} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>{project.name}</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            {project.address || project.description || "Assigned construction project"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Mini label="Status" value={project.status} />
        <Mini label="Milestones" value={milestones.length} />
        <Mini label="Supervisor" value={supervisor?.user?.name || (supervisor ? "Accepted" : "Pending")} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <ActionButton icon="flag-outline" label="Stages" route="/(engineer)/milestones" projectId={project.id} />
        <ActionButton icon="list-outline" label="BOQ" route="/(engineer)/boq" projectId={project.id} />
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <ActionButton icon="receipt-outline" label="RFQs" route="/(engineer)/rfqs" projectId={project.id} />
        <ActionButton icon="camera-outline" label="Progress" route="/(engineer)/progress" projectId={project.id} />
      </View>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 12 }}>
        <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 12, fontWeight: "900" }}>Tap card for full details</Text>
        <Ionicons name="chevron-up-outline" size={16} color={COLORS.PRIMARY_DARK} />
      </View>
    </Pressable>
  );
}

function ProjectDetailSheet({
  project,
  visible,
  onClose,
}: {
  project: EngineerProject | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!project) return null;
  const milestones = project.milestones || [];
  const supervisor = (project.projectMembers || []).find(
    (member) => member.role?.toLowerCase() === "supervisor",
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <SheetHeader label="PROJECT DETAILS" title={project.name} onClose={onClose} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <DetailBlock>
              <InfoLine label="Status" value={project.status} />
              <InfoLine label="Budget" value={`${Number(project.budget || 0).toLocaleString()} ${project.currency || "RWF"}`} />
              <InfoLine label="Location" value={project.address || "Not provided"} />
              <InfoLine label="Client" value={project.client?.name || project.client?.email || "Client"} />
              <InfoLine label="Supervisor" value={supervisor?.user?.name || supervisor?.status || "Not assigned"} />
            </DetailBlock>
            <DetailSection title="Description" body={project.description || "No description provided."} />
            <View style={styles.detailBlock}>
              <Text style={styles.sectionTitle}>Milestones ({milestones.length})</Text>
              {milestones.length === 0 ? (
                <Text style={styles.sectionBody}>No milestones have been created yet.</Text>
              ) : (
                milestones.map((milestone) => (
                  <View key={milestone.id} style={styles.milestoneRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneTitle}>{milestone.name}</Text>
                      <Text style={styles.sectionBody}>{String(milestone.status).replace(/_/g, " ")}</Text>
                    </View>
                    <Text style={styles.milestonePercent}>{Number(milestone.budgetPercentage || 0)}%</Text>
                  </View>
                ))
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <ActionButton icon="flag-outline" label="Stages" route="/(engineer)/milestones" projectId={project.id} />
              <ActionButton icon="list-outline" label="BOQ" route="/(engineer)/boq" projectId={project.id} />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <ActionButton icon="receipt-outline" label="RFQs" route="/(engineer)/rfqs" projectId={project.id} />
              <ActionButton icon="camera-outline" label="Progress" route="/(engineer)/progress" projectId={project.id} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, padding: 10 }}>
      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10, fontWeight: "900" }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontSize: 12, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  route,
  projectId,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: "/(engineer)/milestones" | "/(engineer)/boq" | "/(engineer)/rfqs" | "/(engineer)/progress";
  projectId: string;
}) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: route, params: { projectId } })}
      style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 12 }}
    >
      <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function Empty() {
  return (
    <View style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 28 }}>
      <Ionicons name="business-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>No accepted projects</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6, textAlign: "center" }}>
        Accept a client invitation first, then the project appears here.
      </Text>
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
  milestoneRow: {
    alignItems: "center" as const,
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    flexDirection: "row" as const,
    gap: 10,
    paddingVertical: 10,
  },
  milestoneTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  milestonePercent: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "900" as const,
  },
};
