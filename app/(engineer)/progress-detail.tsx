import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { EngineerProgressPhoto } from "@/components/engineer/engineer-types";
import { ProgressMedia, ProgressMediaViewer } from "@/components/shared/progress-media-viewer";
import { COLORS } from "@/constants/colors";

export default function EngineerProgressDetail() {
  const params = useLocalSearchParams<{ projectId?: string; groupId?: string }>();
  const [viewerMedia, setViewerMedia] = useState<ProgressMedia | null>(null);
  const projectId = params.projectId || "";
  const groupId = params.groupId || "";

  const progressQuery = useQuery({
    queryKey: ["engineer-progress-detail", projectId, groupId],
    enabled: Boolean(projectId && groupId),
    queryFn: async () => {
      const response = await api.get<EngineerProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, {
        params: { projectId },
      });
      return response.data.filter((item) => (item.progressGroupId || item.id) === groupId);
    },
    refetchInterval: 10000,
  });

  const items = progressQuery.data || [];
  const title = items[0]?.milestone?.name || items[0]?.project?.name || "Progress update";
  const status = getGroupStatus(items);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={progressQuery.isRefetching} onRefresh={progressQuery.refetch} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 8, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 24, fontWeight: "900" }}>{title}</Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, marginTop: 4 }}>
              {items.length} media item{items.length === 1 ? "" : "s"} • {status}
            </Text>
          </View>
        </View>

        {progressQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} /> : null}
        {!progressQuery.isLoading && items.length === 0 ? (
          <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
            <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>No media found for this progress update.</Text>
          </View>
        ) : null}

        {items.map((item, index) => {
          const media = {
            url: item.cloudinaryUrl,
            isVideo: item.isVideo,
            title,
            caption: item.caption,
          };

          return (
            <View key={item.id} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" }}>
              <Pressable
                onPress={() => setViewerMedia(media)}
                style={{ alignItems: "center", backgroundColor: item.isVideo ? COLORS.INK : COLORS.MUTED, justifyContent: "center", minHeight: 210 }}
              >
                {item.isVideo ? (
                  <>
                    <Ionicons name="play-circle-outline" size={56} color={COLORS.TEXT_WHITE} />
                    <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>Open video</Text>
                  </>
                ) : (
                  <Image source={{ uri: item.cloudinaryUrl }} style={{ height: 230, width: "100%" }} />
                )}
              </Pressable>
              <View style={{ padding: 14 }}>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "900" }}>
                    {item.isVideo ? "Video" : "Photo"} {index + 1}
                  </Text>
                  <StatusBadge status={item.reviewStatus || "pending"} />
                </View>
                <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 5 }}>
                  {item.caption || "No caption provided."}
                </Text>
                {item.supervisorComment ? (
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                    Supervisor: {item.supervisorComment}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ProgressMediaViewer media={viewerMedia} onClose={() => setViewerMedia(null)} />
    </SafeAreaView>
  );
}

function getGroupStatus(items: EngineerProgressPhoto[]) {
  if (items.some((item) => item.reviewStatus === "rejected")) return "rejected";
  if (items.length > 0 && items.every((item) => item.reviewStatus === "approved")) return "approved";
  return "pending";
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
