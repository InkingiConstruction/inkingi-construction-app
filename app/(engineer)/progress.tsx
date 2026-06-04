import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
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
  const activeProjectId = selectedProjectId || params.projectId || projects[0]?.id || "";

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
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is required to capture progress media.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: kind === "video" ? ["videos"] : ["images"],
      quality: kind === "video" ? 0.75 : 0.85,
      videoMaxDuration: 90,
    });

    if (!result.canceled) {
      setMediaItems((current) => [...current, result.assets[0]]);
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
      if (mediaItems.length === 0) throw new Error("Take progress photos or record a video first.");

      const photoCount = mediaItems.filter((item) => item.type !== "video").length;
      const hasVideo = mediaItems.some((item) => item.type === "video");
      if (!hasVideo && photoCount > 0 && photoCount < 3) {
        throw new Error("Take at least three photos, or record a video.");
      }

      for (const [index, item] of mediaItems.entries()) {
        const form = new FormData();
        form.append("projectId", activeProjectId);
        if (activeMilestoneId) form.append("milestoneId", activeMilestoneId);
        if (caption.trim()) {
          form.append("caption", mediaItems.length > 1 ? `${caption.trim()} (${index + 1}/${mediaItems.length})` : caption.trim());
        }
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
          <Empty text="No accepted engineer projects found." />
        ) : (
          <>
            <Selector items={projects.map((project) => ({ id: project.id, title: project.name, subtitle: project.status }))} activeId={activeProjectId} onSelect={(id) => {
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
            {progress.length === 0 && !progressQuery.isLoading ? <Empty text="No progress uploads yet for this project." /> : null}
            {progress.map((item) => <ProgressCard key={item.id} item={item} onOpen={setViewerMedia} />)}
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

function ProgressCard({ item, onOpen }: { item: EngineerProgressPhoto; onOpen: (media: ProgressMedia) => void }) {
  const media = {
    url: item.cloudinaryUrl,
    isVideo: item.isVideo,
    title: item.milestone?.name || item.project?.name || "Project progress",
    caption: item.caption,
  };

  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" }}>
      {item.isVideo ? (
        <Pressable onPress={() => onOpen(media)} style={{ alignItems: "center", backgroundColor: COLORS.INK, height: 180, justifyContent: "center" }}>
          <Ionicons name="play-circle-outline" size={48} color={COLORS.TEXT_WHITE} />
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>Open video</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => onOpen(media)}>
          <Image source={{ uri: item.cloudinaryUrl }} style={{ backgroundColor: COLORS.MUTED, height: 180, width: "100%" }} />
        </Pressable>
      )}
      <View style={{ padding: 14 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "900" }}>{item.milestone?.name || "Project progress"}</Text>
          <StatusBadge status={item.reviewStatus || "pending"} />
        </View>
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 4 }}>{item.caption || (item.isVideo ? "Video upload" : "Photo upload")}</Text>
        {item.supervisorComment ? (
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
            Supervisor: {item.supervisorComment}
          </Text>
        ) : null}
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
