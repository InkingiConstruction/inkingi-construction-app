import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorProgressPhoto } from "@/components/supervisor/supervisor-types";

export default function ProgressReview() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const [notesById, setNotesById] = useStateMap();

  const progressQuery = useQuery({
    queryKey: ["supervisor-progress", params.projectId],
    queryFn: async () => {
      const response = await api.get<SupervisorProgressPhoto[]>(ENDPOINTS.PROGRESS_PHOTOS.LIST, {
        params: params.projectId ? { projectId: params.projectId } : undefined,
      });
      return response.data;
    },
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) =>
      api.put(ENDPOINTS.PROGRESS_PHOTOS.DETAIL(id), { caption }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supervisor-progress"] }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={progressQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <SupervisorTopBar
            title="Progress review"
            subtitle="Review engineer progress uploads and add supervisor notes."
          />
        }
        ListEmptyComponent={
          progressQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 40 }} />
          ) : (
            <View
              style={{
                alignItems: "center",
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderRadius: 10,
                borderWidth: 1,
                padding: 28,
              }}
            >
              <Ionicons name="images-outline" size={38} color={COLORS.TEXT_LIGHT} />
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>
                No progress uploads
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={progressQuery.isRefetching}
            onRefresh={progressQuery.refetch}
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 10,
              borderWidth: 1,
              padding: 16,
            }}
          >
            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
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
                <Ionicons name={item.isVideo ? "videocam-outline" : "image-outline"} size={23} color={COLORS.PRIMARY_DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                  {item.milestone?.name || "Project progress"}
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  Uploaded by {item.uploadedBy?.name || "project member"}
                </Text>
              </View>
            </View>
            <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 12 }}>
              {item.caption || "No caption provided."}
            </Text>
            <TextInput
              multiline
              onChangeText={(value) => setNotesById(item.id, value)}
              placeholder="Supervisor note"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={{
                backgroundColor: COLORS.MUTED,
                borderRadius: 8,
                color: COLORS.TEXT_PRIMARY,
                marginTop: 12,
                minHeight: 72,
                padding: 12,
              }}
              value={notesById[item.id] || ""}
            />
            <Pressable
              disabled={updateProgress.isPending}
              onPress={() =>
                updateProgress.mutate({
                  id: item.id,
                  caption: notesById[item.id] || item.caption || "Reviewed by supervisor",
                })
              }
              style={{
                alignItems: "center",
                backgroundColor: COLORS.PRIMARY,
                borderRadius: 8,
                marginTop: 12,
                opacity: updateProgress.isPending ? 0.7 : 1,
                paddingVertical: 13,
              }}
            >
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                Save Review Note
              </Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function useStateMap() {
  const [values, setValues] = useState<Record<string, string>>({});
  const setValue = (id: string, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
  };
  return [values, setValue] as const;
}
