import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Linking, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorProgressPhoto } from "@/components/supervisor/supervisor-types";

export default function ProgressReview() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [commentsById, setCommentsById] = useStateMap();

  const progressQuery = useQuery({
    queryKey: ["supervisor-progress", params.projectId],
    queryFn: async () => {
      const response = await api.get<SupervisorProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, {
        params: params.projectId ? { projectId: params.projectId } : undefined,
      });
      return response.data;
    },
    refetchOnMount: "always",
  });

  const reviewProgress = useMutation({
    mutationFn: ({
      id,
      reviewStatus,
      supervisorComment,
    }: {
      id: string;
      reviewStatus: "approved" | "rejected";
      supervisorComment: string;
    }) =>
      api.put(ENDPOINTS.PROGRESS_PHOTOS.DETAIL(id), {
        reviewStatus,
        supervisorComment,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["supervisor-progress"] }),
        queryClient.invalidateQueries({ queryKey: ["client-progress-photos"] }),
        queryClient.invalidateQueries({ queryKey: ["engineer-progress"] }),
      ]);
    },
    onError: (error) => Alert.alert("Review failed", error instanceof Error ? error.message : "Try again."),
  });

  const progress = progressQuery.data || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={progress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <SupervisorTopBar
            title="Progress review"
            subtitle="Approve or reject engineer progress uploads with clear comments."
          />
        }
        ListEmptyComponent={
          progressQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
          ) : (
            <Empty />
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
          const comment = commentsById[item.id] ?? item.supervisorComment ?? "";
          const rejectedWithoutComment = item.reviewStatus !== "rejected" && !comment.trim();

          return (
            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, overflow: "hidden" }}>
              {item.isVideo ? (
                <Pressable
                  onPress={() => Linking.openURL(item.cloudinaryUrl)}
                  style={{ alignItems: "center", backgroundColor: COLORS.INK, height: 190, justifyContent: "center" }}
                >
                  <Ionicons name="play-circle-outline" size={54} color={COLORS.TEXT_WHITE} />
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900", marginTop: 8 }}>Open video</Text>
                </Pressable>
              ) : (
                <Image source={{ uri: item.cloudinaryUrl }} style={{ backgroundColor: COLORS.MUTED, height: 210, width: "100%" }} />
              )}

              <View style={{ padding: 16 }}>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8, height: 42, justifyContent: "center", width: 42 }}>
                    <Ionicons name={item.isVideo ? "videocam-outline" : "image-outline"} size={22} color={COLORS.PRIMARY_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                      {item.milestone?.name || item.project?.name || "Project progress"}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                      Uploaded by {item.uploadedBy?.name || "engineer"}
                    </Text>
                  </View>
                  <StatusBadge status={item.reviewStatus || "pending"} />
                </View>

                <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 12 }}>
                  {item.caption || "No caption provided."}
                </Text>

                <TextInput
                  multiline
                  onChangeText={(value) => setCommentsById(item.id, value)}
                  placeholder="Supervisor comment or rejection reason"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  style={{
                    backgroundColor: COLORS.MUTED,
                    borderRadius: 8,
                    color: COLORS.TEXT_PRIMARY,
                    marginTop: 12,
                    minHeight: 72,
                    padding: 12,
                  }}
                  value={comment}
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    disabled={reviewProgress.isPending || rejectedWithoutComment}
                    onPress={() =>
                      reviewProgress.mutate({
                        id: item.id,
                        reviewStatus: "rejected",
                        supervisorComment: comment.trim(),
                      })
                    }
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.MUTED,
                      borderRadius: 8,
                      flex: 1,
                      opacity: reviewProgress.isPending || rejectedWithoutComment ? 0.55 : 1,
                      paddingVertical: 13,
                    }}
                  >
                    <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Reject</Text>
                  </Pressable>
                  <Pressable
                    disabled={reviewProgress.isPending}
                    onPress={() =>
                      reviewProgress.mutate({
                        id: item.id,
                        reviewStatus: "approved",
                        supervisorComment: comment.trim() || "Progress approved.",
                      })
                    }
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.PRIMARY,
                      borderRadius: 8,
                      flex: 1,
                      opacity: reviewProgress.isPending ? 0.7 : 1,
                      paddingVertical: 13,
                    }}
                  >
                    <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Approve</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
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

function Empty() {
  return (
    <View style={{ alignItems: "center", backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 28 }}>
      <Ionicons name="images-outline" size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>No progress uploads</Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 6, textAlign: "center" }}>
        Engineer photos and videos appear here after upload.
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
