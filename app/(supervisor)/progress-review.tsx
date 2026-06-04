import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorProgressPhoto } from "@/components/supervisor/supervisor-types";
import { ProgressMedia, ProgressMediaViewer } from "@/components/shared/progress-media-viewer";

type ProgressGroup = {
  id: string;
  items: SupervisorProgressPhoto[];
  representative: SupervisorProgressPhoto;
  mediaCount: number;
  photoCount: number;
  videoCount: number;
  status: "pending" | "approved" | "rejected";
};

export default function ProgressReview() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [commentsById, setCommentsById] = useStateMap();
  const [viewerMedia, setViewerMedia] = useState<ProgressMedia | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(params.projectId || "");
  const [selectedProgressGroupId, setSelectedProgressGroupId] = useState("");

  const progressQuery = useQuery({
    queryKey: ["supervisor-progress", params.projectId],
    queryFn: async () => {
      const response = await api.get<SupervisorProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, {
        params: params.projectId ? { projectId: params.projectId } : undefined,
      });
      return response.data;
    },
    refetchOnMount: "always",
    refetchInterval: 10000,
  });

  const reviewProgress = useMutation({
    mutationFn: ({
      ids,
      reviewStatus,
      supervisorComment,
    }: {
      ids: string[];
      reviewStatus: "approved" | "rejected";
      supervisorComment: string;
    }) =>
      Promise.all(
        ids.map((id) =>
          api.put(ENDPOINTS.PROGRESS_PHOTOS.DETAIL(id), {
            reviewStatus,
            supervisorComment,
          }),
        ),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["supervisor-progress"] }),
        queryClient.invalidateQueries({ queryKey: ["client-progress-photos"] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-progress"] }),
      ]);
    },
    onError: (error) => Alert.alert("Review failed", error instanceof Error ? error.message : "Try again."),
  });

  const progress = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);
  const progressGroups = useMemo(() => groupProgress(progress), [progress]);
  const projects = useMemo(() => {
    const projectMap = new Map<string, { id: string; name: string; count: number; pending: number }>();

    for (const group of progressGroups) {
      const item = group.representative;
      const id = item.projectId;
      const current = projectMap.get(id) || {
        id,
        name: item.project?.name || "Project",
        count: 0,
        pending: 0,
      };
      current.count += 1;
      if (group.status === "pending") current.pending += 1;
      projectMap.set(id, current);
    }

    return [...projectMap.values()];
  }, [progressGroups]);
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const projectProgress = activeProjectId
    ? progressGroups.filter((group) => group.representative.projectId === activeProjectId)
    : progressGroups;
  const selectedProgressGroup = progressGroups.find((group) => group.id === selectedProgressGroupId);

  const openProgress = (id: string) => {
    setSelectedProgressGroupId(id);
  };

  const closeSheet = () => setSelectedProgressGroupId("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={projectProgress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <SupervisorTopBar
              title="Progress review"
              subtitle="Open a project, then review each progress photo or video from a bottom sheet."
            />
            {!params.projectId ? (
              <ProjectPicker
                activeProjectId={activeProjectId}
                projects={projects}
                onSelect={(id) => setSelectedProjectId(id)}
              />
            ) : null}
            {activeProject ? (
              <View style={styles.projectSummary}>
                <Text style={styles.projectEyebrow}>SELECTED PROJECT</Text>
                <Text style={styles.projectTitle}>{activeProject.name}</Text>
                <Text style={styles.projectBody}>
                  {activeProject.count} update{activeProject.count === 1 ? "" : "s"} • {activeProject.pending} pending review
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          progressQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
          ) : (
            <Empty text={projects.length === 0 ? "Engineer photos and videos appear here after upload." : "No progress uploads for this project."} />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={progressQuery.isRefetching}
            onRefresh={progressQuery.refetch}
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => {
          const group = item;
          const representative = group.representative;
          const media = {
            url: representative.cloudinaryUrl,
            isVideo: representative.isVideo,
            title: representative.milestone?.name || representative.project?.name || "Project progress",
            caption: representative.caption,
          };

          return (
            <Pressable onPress={() => openProgress(group.id)} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" }}>
              {representative.isVideo ? (
                <Pressable
                  onPress={() => setViewerMedia(media)}
                  style={{ alignItems: "center", backgroundColor: COLORS.INK, height: 190, justifyContent: "center" }}
                >
                  <Ionicons name="play-circle-outline" size={54} color={COLORS.TEXT_WHITE} />
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>Open video</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setViewerMedia(media)}>
                  <Image source={{ uri: representative.cloudinaryUrl }} style={{ backgroundColor: COLORS.MUTED, height: 210, width: "100%" }} />
                </Pressable>
              )}

              <View style={{ padding: 16 }}>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, height: 42, justifyContent: "center", width: 42 }}>
                    <Ionicons name={representative.isVideo ? "videocam-outline" : "image-outline"} size={22} color={COLORS.PRIMARY_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                      {representative.milestone?.name || representative.project?.name || "Project progress"}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                      Uploaded by {representative.uploadedBy?.name || "engineer"} • {group.mediaCount} media
                    </Text>
                  </View>
                  <StatusBadge status={group.status} />
                </View>

                <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 12 }}>
                  {representative.caption || "No caption provided."}
                </Text>
                <View style={styles.openHint}>
                  <Text style={styles.openHintText}>Tap for full review</Text>
                  <Ionicons name="chevron-up-outline" size={16} color={COLORS.PRIMARY_DARK} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <ProgressReviewSheet
        comment={selectedProgressGroup ? commentsById[selectedProgressGroup.id] ?? selectedProgressGroup.representative.supervisorComment ?? "" : ""}
        group={selectedProgressGroup}
        loading={reviewProgress.isPending}
        visible={Boolean(selectedProgressGroup)}
        onApprove={(comment) => {
          if (!selectedProgressGroup) return;
          reviewProgress.mutate({
            ids: selectedProgressGroup.items.map((item) => item.id),
            reviewStatus: "approved",
            supervisorComment: comment.trim() || "Progress approved.",
          });
          closeSheet();
        }}
        onClose={closeSheet}
        onCommentChange={(value) => selectedProgressGroup && setCommentsById(selectedProgressGroup.id, value)}
        onOpenMedia={setViewerMedia}
        onReject={(comment) => {
          if (!selectedProgressGroup) return;
          reviewProgress.mutate({
            ids: selectedProgressGroup.items.map((item) => item.id),
            reviewStatus: "rejected",
            supervisorComment: comment.trim(),
          });
          closeSheet();
        }}
      />
      <ProgressMediaViewer media={viewerMedia} onClose={() => setViewerMedia(null)} />
    </SafeAreaView>
  );
}

function groupProgress(items: SupervisorProgressPhoto[]): ProgressGroup[] {
  const grouped = new Map<string, SupervisorProgressPhoto[]>();

  for (const item of items) {
    const groupId = item.progressGroupId || item.id;
    grouped.set(groupId, [...(grouped.get(groupId) || []), item]);
  }

  return [...grouped.entries()]
    .map(([id, groupItems]) => {
      const ordered = [...groupItems].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const representative = ordered[0];
      const hasRejected = ordered.some((item) => item.reviewStatus === "rejected");
      const allApproved = ordered.every((item) => item.reviewStatus === "approved");
      const videoCount = ordered.filter((item) => item.isVideo).length;
      const status: ProgressGroup["status"] = hasRejected ? "rejected" : allApproved ? "approved" : "pending";
      return {
        id,
        items: ordered,
        representative,
        mediaCount: ordered.length,
        photoCount: ordered.length - videoCount,
        videoCount,
        status,
      };
    })
    .sort((a, b) => new Date(b.representative.createdAt).getTime() - new Date(a.representative.createdAt).getTime());
}

function ProjectPicker({
  projects,
  activeProjectId,
  onSelect,
}: {
  projects: { id: string; name: string; count: number; pending: number }[];
  activeProjectId: string;
  onSelect: (id: string) => void;
}) {
  if (projects.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
      {projects.map((project) => {
        const active = project.id === activeProjectId;
        return (
          <Pressable
            key={project.id}
            onPress={() => onSelect(project.id)}
            style={[styles.projectChip, active && styles.projectChipActive]}
          >
            <Text numberOfLines={1} style={[styles.projectChipTitle, active && styles.projectChipTitleActive]}>
              {project.name}
            </Text>
            <Text style={[styles.projectChipBody, active && styles.projectChipBodyActive]}>
              {project.pending} pending • {project.count} total
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ProgressReviewSheet({
  visible,
  group,
  comment,
  loading,
  onClose,
  onCommentChange,
  onOpenMedia,
  onApprove,
  onReject,
}: {
  visible: boolean;
  group?: ProgressGroup;
  comment: string;
  loading: boolean;
  onClose: () => void;
  onCommentChange: (value: string) => void;
  onOpenMedia: (media: ProgressMedia) => void;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
}) {
  if (!group) return null;

  const item = group.representative;
  const rejectDisabled = loading || !comment.trim();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={{ alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetEyebrow}>PROGRESS DETAIL</Text>
              <Text style={styles.sheetTitle}>{item.milestone?.name || item.project?.name || "Project progress"}</Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                {group.mediaCount} media item{group.mediaCount === 1 ? "" : "s"} • {group.photoCount} photo{group.photoCount === 1 ? "" : "s"} • {group.videoCount} video{group.videoCount === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={{ gap: 10, marginTop: 16 }}>
              {group.items.map((mediaItem, index) => {
                const media = {
                  url: mediaItem.cloudinaryUrl,
                  isVideo: mediaItem.isVideo,
                  title: mediaItem.milestone?.name || mediaItem.project?.name || "Project progress",
                  caption: mediaItem.caption,
                };

                return (
                  <Pressable key={mediaItem.id} onPress={() => onOpenMedia(media)} style={styles.sheetMedia}>
                    {mediaItem.isVideo ? (
                      <>
                        <Ionicons name="play-circle-outline" size={56} color={COLORS.TEXT_WHITE} />
                        <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>Open video {index + 1}</Text>
                      </>
                    ) : (
                      <Image source={{ uri: mediaItem.cloudinaryUrl }} style={{ height: 220, width: "100%" }} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.detailCard}>
              <InfoLine label="Project" value={item.project?.name || "Project"} />
              <InfoLine label="Milestone" value={item.milestone?.name || "Not linked"} />
              <InfoLine label="Uploaded by" value={item.uploadedBy?.name || "Engineer"} />
              <InfoLine label="Media" value={`${group.photoCount} photo${group.photoCount === 1 ? "" : "s"}, ${group.videoCount} video${group.videoCount === 1 ? "" : "s"}`} />
              <InfoLine label="Status" value={group.status} />
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Caption</Text>
              <Text style={styles.detailBody}>{item.caption || "No caption provided."}</Text>
              {item.supervisorComment ? (
                <>
                  <Text style={[styles.detailTitle, { marginTop: 14 }]}>Previous comment</Text>
                  <Text style={styles.detailBody}>{item.supervisorComment}</Text>
                </>
              ) : null}
            </View>

            <TextInput
              multiline
              onChangeText={onCommentChange}
              placeholder="Supervisor comment or rejection reason"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={styles.commentInput}
              value={comment}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                disabled={rejectDisabled}
                onPress={() => onReject(comment)}
                style={[styles.rejectButton, rejectDisabled && { opacity: 0.55 }]}
              >
                <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
              </Pressable>
              <Pressable
                disabled={loading}
                onPress={() => onApprove(comment)}
                style={[styles.approveButton, loading && { opacity: 0.7 }]}
              >
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Approve</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  return (
    <View style={{ backgroundColor: isApproved ? COLORS.PRIMARY_LIGHT : isRejected ? "#FEE2E2" : COLORS.MUTED, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: isApproved ? COLORS.PRIMARY_DARK : isRejected ? COLORS.ERROR : COLORS.TEXT_SECONDARY, fontSize: 10, fontWeight: "900" }}>
        {status}
      </Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 28 }}>
      <Ionicons name="images-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>No progress uploads</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 6, textAlign: "center" }}>
        {text}
      </Text>
    </View>
  );
}

function useStateMap() {
  const [values, setValues] = useState<Record<string, string>>({});
  const setValue = (id: string, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
  };
  return [values, setValue] as const;
}

const styles = {
  projectChip: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 230,
    padding: 12,
  },
  projectChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  projectChipTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "900" as const,
  },
  projectChipTitleActive: {
    color: COLORS.TEXT_WHITE,
  },
  projectChipBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 3,
  },
  projectChipBodyActive: {
    color: COLORS.TEXT_WHITE,
  },
  projectSummary: {
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    marginBottom: 4,
    padding: 16,
  },
  projectEyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "900" as const,
  },
  projectTitle: {
    color: COLORS.TEXT_WHITE,
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  projectBody: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 4,
  },
  openHint: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    flexDirection: "row" as const,
    gap: 6,
    justifyContent: "center" as const,
    marginTop: 12,
    paddingVertical: 10,
  },
  openHintText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "900" as const,
  },
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
    maxHeight: "90%" as const,
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
  sheetMedia: {
    alignItems: "center" as const,
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    justifyContent: "center" as const,
    marginTop: 16,
    minHeight: 220,
    overflow: "hidden" as const,
  },
  detailCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  detailTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  detailBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
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
  commentInput: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    minHeight: 86,
    padding: 12,
    textAlignVertical: "top" as const,
  },
  rejectButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
  approveButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 13,
  },
};
