import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerMilestone, EngineerProgressPhoto, EngineerProject } from "@/components/engineer/engineer-types";
import { isAcceptedEngineerProject } from "@/components/engineer/engineer-utils";
import { ProgressMedia, ProgressMediaViewer } from "@/components/shared/progress-media-viewer";

type CapturedMedia = ImagePicker.ImagePickerAsset;
type ProgressGroup = {
  id: string;
  items: EngineerProgressPhoto[];
  representative: EngineerProgressPhoto;
  mediaCount: number;
  photoCount: number;
  videoCount: number;
  status: "pending" | "approved" | "rejected";
};

export default function EngineerProgress() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaItems, setMediaItems] = useState<CapturedMedia[]>([]);
  const [viewerMedia, setViewerMedia] = useState<ProgressMedia | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => (await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
    refetchInterval: 10000,
  });

  const projects = (projectsQuery.data || []).filter(isAcceptedEngineerProject);
  const activeProjects = projects.filter((project) => project.status === "active");
  const requestedProjectId = selectedProjectId || params.projectId || "";
  const activeProjectId =
    activeProjects.find((project) => project.id === requestedProjectId)?.id || activeProjects[0]?.id || "";

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId: activeProjectId } })).data,
    refetchInterval: 10000,
  });

  const milestones = milestonesQuery.data || [];
  const activeMilestoneId = selectedMilestoneId || milestones[0]?.id || "";

  const progressQuery = useQuery({
    queryKey: ["engineer-progress", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => (await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, { params: { projectId: activeProjectId } })).data,
    refetchInterval: 10000,
  });

  const captureMedia = async (kind: "photo" | "video") => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Camera permission is required to capture progress media.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: kind === "video" ? ["videos"] : ["images"],
        quality: kind === "video" ? 0.7 : 0.8,
        videoMaxDuration: 75,
      });

      if (!result.canceled) {
        setMediaItems((current) => [...current, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert("Camera failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const pickFromPhone = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Phone gallery permission is required to attach progress media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      mediaTypes: ["images", "videos"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setMediaItems((current) => [...current, ...result.assets]);
    }
  };

  const removeMedia = (uri: string) => {
    setMediaItems((current) => current.filter((item) => item.uri !== uri));
  };

  const submitProgress = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      if (!activeProjectId) throw new Error("Select a project first.");
      const selectedProject = activeProjects.find((project) => project.id === activeProjectId);
      if (!selectedProject || selectedProject.status !== "active") {
        throw new Error("Progress can only be uploaded on active projects.");
      }
      if (mediaItems.length === 0) throw new Error("Take progress photos or record a video first.");

      const photoCount = mediaItems.filter((item) => item.type !== "video").length;
      const hasVideo = mediaItems.some((item) => item.type === "video");
      if (!hasVideo && photoCount > 0 && photoCount < 3) {
        throw new Error("Take at least three photos, or record a video.");
      }

      const sharedCaption = caption.trim();
      const progressGroupId = `progress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      for (const [index, item] of mediaItems.entries()) {
        const form = new FormData();
        form.append("projectId", activeProjectId);
        form.append("progressGroupId", progressGroupId);
        form.append("notifyOnUpload", index === mediaItems.length - 1 ? "true" : "false");
        if (activeMilestoneId) form.append("milestoneId", activeMilestoneId);
        if (sharedCaption) form.append("caption", sharedCaption);
        form.append("media", {
          uri: item.uri,
          name: item.fileName || `progress-${Date.now()}-${index}.${item.type === "video" ? "mp4" : "jpg"}`,
          type: item.mimeType || (item.type === "video" ? "video/mp4" : "image/jpeg"),
        } as unknown as Blob);

        await api.post(ENDPOINTS.PROGRESS_PHOTOS.CREATE, form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 45000,
        });
      }

      setCaption("");
      setMediaItems([]);
      void Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-progress", activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["supervisor-progress"] }),
      ]);
      Alert.alert("Progress submitted", "The supervisor can now review the update.");
    } catch (error) {
      Alert.alert("Submit failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = progressQuery.data || [];
  const progressGroups = groupProgress(progress);
  const refreshing = projectsQuery.isRefetching || milestonesQuery.isRefetching || progressQuery.isRefetching;
  const refresh = () => {
    projectsQuery.refetch();
    milestonesQuery.refetch();
    progressQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>Progress upload</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Submit progress media with captions for supervisor and client visibility.
          </Text>
        </View>

        {projectsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <Empty text="No accepted Main Contractor projects found." />
        ) : activeProjects.length === 0 ? (
          <Empty text="Progress uploads open after a project becomes active." />
        ) : (
          <>
            <Selector items={activeProjects.map((project) => ({ id: project.id, title: project.name, subtitle: project.status }))} activeId={activeProjectId} onSelect={(id) => {
              setSelectedProjectId(id);
              setSelectedMilestoneId("");
            }} />
            <Selector items={milestones.map((milestone) => ({ id: milestone.id, title: milestone.name, subtitle: milestone.status }))} activeId={activeMilestoneId} onSelect={setSelectedMilestoneId} emptyText="Progress can be uploaded without a milestone, but creating one is recommended." />

            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16, gap: 10 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>New progress update</Text>
              <TextInput
                placeholder="Caption"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={caption}
                onChangeText={setCaption}
                style={{ backgroundColor: COLORS.MUTED, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, color: COLORS.TEXT_PRIMARY, paddingHorizontal: 12, paddingVertical: 12 }}
              />
              {mediaItems.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {mediaItems.map((item) => (
                    <View key={item.uri} style={{ borderRadius: 8, overflow: "hidden", position: "relative" }}>
                      {item.type === "video" ? (
                        <View style={{ alignItems: "center", backgroundColor: COLORS.INK, height: 104, justifyContent: "center", width: 128 }}>
                          <Ionicons name="videocam-outline" size={28} color={COLORS.TEXT_WHITE} />
                          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 11, fontWeight: "900", marginTop: 4 }}>Video</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: item.uri }} style={{ backgroundColor: COLORS.MUTED, height: 104, width: 128 }} />
                      )}
                      <Pressable
                        onPress={() => removeMedia(item.uri)}
                        style={{ alignItems: "center", backgroundColor: "rgba(15,23,42,0.78)", borderRadius: 999, height: 26, justifyContent: "center", position: "absolute", right: 6, top: 6, width: 26 }}
                      >
                        <Ionicons name="close" size={16} color={COLORS.TEXT_WHITE} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => captureMedia("photo")} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, gap: 6, justifyContent: "center", minHeight: 58, paddingVertical: 10 }}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.PRIMARY_DARK} />
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 12, fontWeight: "900" }}>Take photo</Text>
                </Pressable>
                <Pressable onPress={() => captureMedia("video")} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, gap: 6, justifyContent: "center", minHeight: 58, paddingVertical: 10 }}>
                  <Ionicons name="videocam-outline" size={18} color={COLORS.PRIMARY_DARK} />
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 12, fontWeight: "900" }}>Take video</Text>
                </Pressable>
                <Pressable onPress={pickFromPhone} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, gap: 6, justifyContent: "center", minHeight: 58, paddingVertical: 10 }}>
                  <Ionicons name="phone-portrait-outline" size={18} color={COLORS.PRIMARY_DARK} />
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 12, fontWeight: "900" }}>From phone</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable disabled={submitting} onPress={submitProgress} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, opacity: submitting ? 0.75 : 1, paddingVertical: 13 }}>
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                    {submitting ? "Submitting..." : `Submit ${mediaItems.length || ""}`}
                  </Text>
                </Pressable>
              </View>
            </View>

            {progressQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
            {progressGroups.length === 0 && !progressQuery.isLoading ? <Empty text="No progress uploads yet for this project." /> : null}
            {progressGroups.map((group) => (
              <ProgressGroupCard
                key={group.id}
                group={group}
                onOpen={() =>
                  router.push({
                    pathname: "/(engineer)/progress-detail",
                    params: { projectId: activeProjectId, groupId: group.id },
                  })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
      <ProgressMediaViewer media={viewerMedia} onClose={() => setViewerMedia(null)} />
    </SafeAreaView>
  );
}

function Selector({
  items,
  activeId,
  onSelect,
  emptyText,
}: {
  items: { id: string; title: string; subtitle?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0) return <Empty text={emptyText || "Nothing to select yet."} />;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable key={item.id} onPress={() => onSelect(item.id)} style={{ backgroundColor: active ? COLORS.PRIMARY : COLORS.SURFACE, borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, maxWidth: 230, padding: 12 }}>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.title}</Text>
            <Text numberOfLines={1} style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>{item.subtitle || "Select"}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function groupProgress(items: EngineerProgressPhoto[]): ProgressGroup[] {
  const grouped = new Map<string, EngineerProgressPhoto[]>();

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

function ProgressGroupCard({
  group,
  onOpen,
}: {
  group: ProgressGroup;
  onOpen: () => void;
}) {
  const item = group.representative;

  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" }}>
      {item.isVideo ? (
        <Pressable onPress={onOpen} style={{ alignItems: "center", backgroundColor: COLORS.INK, height: 180, justifyContent: "center" }}>
          <Ionicons name="play-circle-outline" size={48} color={COLORS.TEXT_WHITE} />
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>View details</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onOpen}>
          <Image source={{ uri: item.cloudinaryUrl }} style={{ backgroundColor: COLORS.MUTED, height: 180, width: "100%" }} />
        </Pressable>
      )}
      <View style={{ padding: 14 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "900" }}>{item.milestone?.name || "Project progress"}</Text>
          <StatusBadge status={group.status} />
        </View>
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 4 }}>
          {item.caption || "Progress update"} • {group.mediaCount} media ({group.photoCount} photo{group.photoCount === 1 ? "" : "s"}, {group.videoCount} video{group.videoCount === 1 ? "" : "s"})
        </Text>
        {item.supervisorComment ? (
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
            Supervisor: {item.supervisorComment}
          </Text>
        ) : null}
        <Pressable onPress={onOpen} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 12, paddingVertical: 11 }}>
          <Ionicons name="albums-outline" size={17} color={COLORS.PRIMARY_DARK} />
          <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>View full update</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  return (
    <View style={{ backgroundColor: isApproved ? COLORS.PRIMARY_LIGHT : isRejected ? "#FEE2E2" : COLORS.MUTED, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }}>
      <Text style={{ color: isApproved ? COLORS.PRIMARY_DARK : isRejected ? COLORS.ERROR : COLORS.TEXT_SECONDARY, fontSize: 10, fontWeight: "900" }}>
        {status}
      </Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
