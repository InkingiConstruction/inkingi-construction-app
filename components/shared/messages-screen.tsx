import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type ProjectMessage = {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  project?: {
    name?: string;
  };
};

export function MessagesScreen() {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await api.get<ProjectMessage[]>(ENDPOINTS.MESSAGES.LIST);
      return response.data;
    },
  });

  const sendMessage = useMutation({
    mutationFn: () =>
      api.post(ENDPOINTS.MESSAGES.CREATE, {
        projectId: projectId.trim(),
        content: content.trim(),
      }),
    onSuccess: () => {
      setContent("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to send message");
    },
  });

  const submit = () => {
    if (!projectId.trim() || !content.trim()) {
      setError("Project ID and message are required");
      return;
    }

    sendMessage.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{ gap: 6, marginBottom: 18 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
              Messages
            </Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
              Send and review project messages connected to your active projects.
            </Text>
          </View>

          {messagesQuery.isLoading ? (
            <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
              <ActivityIndicator color={COLORS.PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={messagesQuery.data || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingBottom: 220 }}
              refreshControl={
                <RefreshControl
                  refreshing={messagesQuery.isRefetching}
                  onRefresh={messagesQuery.refetch}
                  tintColor={COLORS.PRIMARY}
                />
              }
              ListEmptyComponent={
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.SURFACE,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderRadius: 18,
                    borderWidth: 1,
                    padding: 28,
                  }}
                >
                  <Ionicons name="chatbubbles-outline" size={38} color={COLORS.TEXT_LIGHT} />
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>
                    No project messages yet
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: COLORS.SURFACE,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderRadius: 16,
                    borderWidth: 1,
                    padding: 16,
                  }}
                >
                  <View style={{ alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 8 }}>
                    <View
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.PRIMARY_LIGHT,
                        borderRadius: 14,
                        height: 40,
                        justifyContent: "center",
                        width: 40,
                      }}
                    >
                      <Ionicons name="person-outline" size={19} color={COLORS.PRIMARY_DARK} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                        {item.sender?.name || "Project member"}
                      </Text>
                      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11 }}>
                        {item.project?.name || item.projectId}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
                    {item.content}
                  </Text>
                  <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, marginTop: 8 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}

          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 18,
              borderWidth: 1,
              bottom: 86,
              left: 20,
              padding: 12,
              position: "absolute",
              right: 20,
            }}
          >
            <TextInput
              autoCapitalize="none"
              onChangeText={setProjectId}
              placeholder="Project ID"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={{
                backgroundColor: COLORS.MUTED,
                borderRadius: 12,
                color: COLORS.TEXT_PRIMARY,
                marginBottom: 8,
                padding: 12,
              }}
              value={projectId}
            />
            <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
              <TextInput
                multiline
                onChangeText={setContent}
                placeholder="Write a project message"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                style={{
                  backgroundColor: COLORS.MUTED,
                  borderRadius: 12,
                  color: COLORS.TEXT_PRIMARY,
                  flex: 1,
                  maxHeight: 90,
                  minHeight: 46,
                  padding: 12,
                }}
                value={content}
              />
              <Pressable
                disabled={sendMessage.isPending}
                onPress={submit}
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 14,
                  height: 48,
                  justifyContent: "center",
                  opacity: sendMessage.isPending ? 0.7 : 1,
                  width: 48,
                }}
              >
                <Ionicons name="send-outline" size={20} color={COLORS.TEXT_WHITE} />
              </Pressable>
            </View>
            {error ? (
              <Text style={{ color: COLORS.ERROR, fontSize: 11, fontWeight: "800", marginTop: 8 }}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
