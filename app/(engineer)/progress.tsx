import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { EngineerMilestone, EngineerProgressPhoto, EngineerProject } from "@/components/engineer/engineer-types";
import { ProgressMedia, ProgressMediaViewer } from "@/components/shared/progress-media-viewer";

export default function EngineerProgress() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [viewerMedia, setViewerMedia] = useState<ProgressMedia | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["engineer-projects"],
    queryFn: async () => (await api.get<EngineerProject[]>(ENDPOINTS.PROJECTS.LIST)).data,
    refetchOnMount: "always",
  });

  const projects = (projectsQuery.data || []).filter((project) => project.engineerId);
  const activeProjectId = selectedProjectId || params.projectId || projects[0]?.id || "";

  const milestonesQuery = useQuery({
    queryKey: ["engineer-milestones", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => (await api.get<EngineerMilestone[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId: activeProjectId } })).data,
  });

  const milestones = milestonesQuery.data || [];
  const activeMilestoneId = selectedMilestoneId || milestones[0]?.id || "";

  const progressQuery = useQuery({
    queryKey: ["engineer-progress", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => (await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, { params: { projectId: activeProjectId } })).data,
  });

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery permission is required to upload progress media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images", "videos"],
      quality: 0.85,
    });

    if (!result.canceled) setMedia(result.assets[0]);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!activeProjectId) throw new Error("Select a project first.");
      if (!media) throw new Error("Choose a photo or video first.");

      const form = new FormData();
      form.append("projectId", activeProjectId);
      if (activeMilestoneId) form.append("milestoneId", activeMilestoneId);
      if (caption.trim()) form.append("caption", caption.trim());
      form.append("media", {
        uri: media.uri,
        name: media.fileName || `progress-${Date.now()}.${media.type === "video" ? "mp4" : "jpg"}`,
        type: media.mimeType || (media.type === "video" ? "video/mp4" : "image/jpeg"),
      } as unknown as Blob);

      return api.post(ENDPOINTS.PROGRESS_PHOTOS.CREATE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: async () => {
      setCaption("");
      setMedia(null);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["engineer-progress", activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["supervisor-progress"] }),
      ]);
      Alert.alert("Progress uploaded", "The supervisor can now review the update.");
    },
    onError: (error) => Alert.alert("Upload failed", error instanceof Error ? error.message : "Try again."),
  });

  const progress = progressQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>Progress upload</Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 }}>
            Upload progress media with captions for supervisor and client visibility.
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
              {media ? (
                <Image source={{ uri: media.uri }} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, height: 160, width: "100%" }} />
              ) : null}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={pickMedia} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 13 }}>
                  <Ionicons name="image-outline" size={18} color={COLORS.PRIMARY_DARK} />
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "900" }}>Choose media</Text>
                </Pressable>
                <Pressable disabled={uploadMutation.isPending} onPress={() => uploadMutation.mutate()} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, paddingVertical: 13 }}>
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{uploadMutation.isPending ? "Uploading..." : "Upload"}</Text>
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
