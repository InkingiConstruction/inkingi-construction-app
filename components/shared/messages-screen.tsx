import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { useAuthStore } from "@/store/auth.store";

type ProjectMessage = {
  id: string;
  projectId: string;
  content: string;
  photoUrl?: string | null;
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

type ChatProject = {
  id: string;
  name: string;
};

export function MessagesScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["chat-projects"],
    queryFn: async () => {
      const response = await api.get<ChatProject[]>(ENDPOINTS.PROJECTS.LIST);
      return response.data;
    },
  });

  const projects = projectsQuery.data || [];
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const selectedProject = projects.find((project) => project.id === activeProjectId);

  const messagesQuery = useQuery({
    queryKey: ["messages", activeProjectId],
    enabled: Boolean(activeProjectId),
    queryFn: async () => {
      const response = await api.get<ProjectMessage[]>(ENDPOINTS.MESSAGES.LIST, {
        params: { projectId: activeProjectId },
      });
      return response.data;
    },
  });

  const messages = messagesQuery.data || [];
  const activeProject = useMemo(() => {
    return selectedProject?.name || messages[0]?.project?.name || "Select Project";
  }, [messages, selectedProject]);

  const sendMessage = useMutation({
    mutationFn: () => {
      if (!image) {
        return api.post(ENDPOINTS.MESSAGES.CREATE, {
          projectId: activeProjectId,
          content: content.trim(),
        });
      }

      const formData = new FormData();
      const fileName = image.fileName || image.uri.split("/").pop() || "chat-image.jpg";
      const mimeType = image.mimeType || "image/jpeg";

      formData.append("projectId", activeProjectId);
      formData.append("content", content.trim() || "Photo attachment");
      formData.append("image", {
        uri: image.uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);

      return api.post(ENDPOINTS.MESSAGES.CREATE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      setContent("");
      setImage(null);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to send message");
    },
  });

  const submit = () => {
    if (!activeProjectId || (!content.trim() && !image)) {
      setError("Select a project and add a message or image");
      return;
    }

    sendMessage.mutate();
  };

  const pickImage = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Gallery permission is required to attach an image");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "#FAFBFC" }}>
          <DottedBackground />
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 18,
              paddingTop: 12,
              zIndex: 2,
            }}
          >
            <Pressable onPress={() => router.back()} style={headerButtonStyle}>
              <Ionicons name="arrow-back" size={21} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
            <View
              style={{
                alignItems: "center",
                backgroundColor: "#EEF2F7",
                borderRadius: 18,
                flexDirection: "row",
                gap: 6,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "800", maxWidth: 150 }}>
                {activeProject}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.TEXT_SECONDARY} />
            </View>
            <Pressable style={headerButtonStyle}>
              <Ionicons name="ellipsis-horizontal" size={21} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
          </View>

          {projectsQuery.isLoading || messagesQuery.isLoading ? (
            <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
              <ActivityIndicator color={COLORS.PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                gap: 12,
                paddingBottom: 178,
                paddingHorizontal: 16,
                paddingTop: 26,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={messagesQuery.isRefetching}
                  onRefresh={messagesQuery.refetch}
                  tintColor={COLORS.PRIMARY}
                />
              }
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 120 }}>
                  <View style={{ ...headerButtonStyle, height: 54, width: 54 }}>
                    <Ionicons name="chatbubbles-outline" size={25} color={COLORS.TEXT_LIGHT} />
                  </View>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 14 }}>
                    No messages yet
                  </Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 6, textAlign: "center" }}>
                    Select one of your projects and start the site conversation.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isMine = item.sender?.id === user?.id;
                return <ChatBubble item={item} isMine={isMine} />;
              }}
            />
          )}

          <View
            style={{
              bottom: 18,
              left: 14,
              position: "absolute",
              right: 14,
              zIndex: 3,
            }}
          >
            <View style={{ alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
              <QuickChip label="Learn more" color="#DCFCE7" />
              <QuickChip label="Change request" color="#F5E8D8" />
              <QuickChip label="Successful answer" color="#E0F2FE" />
            </View>
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderRadius: 22,
                borderWidth: 1,
                padding: 10,
                shadowColor: "#0F172A",
                shadowOpacity: 0.08,
                shadowRadius: 18,
              }}
            >
              <FlatList
                data={projects}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                ListEmptyComponent={
                  <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, paddingHorizontal: 8 }}>
                    No accessible projects
                  </Text>
                }
                renderItem={({ item }) => {
                  const selected = item.id === activeProjectId;
                  return (
                    <Pressable
                      onPress={() => setSelectedProjectId(item.id)}
                      style={{
                        backgroundColor: selected ? COLORS.PRIMARY : "#EEF2F7",
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: selected ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY,
                          fontSize: 12,
                          fontWeight: "800",
                          maxWidth: 130,
                        }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
              {image ? (
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "#F8FAFC",
                    borderRadius: 10,
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 8,
                    padding: 8,
                  }}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={{ borderRadius: 8, height: 44, width: 44 }}
                  />
                  <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "700" }}>
                    {image.fileName || "Selected image"}
                  </Text>
                  <Pressable onPress={() => setImage(null)}>
                    <Ionicons name="close-circle" size={22} color={COLORS.TEXT_SECONDARY} />
                  </Pressable>
                </View>
              ) : null}
              <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
                <Pressable onPress={pickImage}>
                  <Ionicons name="attach-outline" size={22} color={COLORS.TEXT_PRIMARY} />
                </Pressable>
                <TextInput
                  multiline
                  onChangeText={setContent}
                  placeholder="Ask anything..."
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                    flex: 1,
                    maxHeight: 90,
                    minHeight: 38,
                    paddingVertical: 8,
                  }}
                  value={content}
                />
                <Pressable
                  disabled={sendMessage.isPending}
                  onPress={submit}
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 18,
                    height: 36,
                    justifyContent: "center",
                    opacity: sendMessage.isPending ? 0.7 : 1,
                    width: 36,
                  }}
                >
                  <Ionicons name="send-outline" size={17} color={COLORS.TEXT_WHITE} />
                </Pressable>
              </View>
              {error ? (
                <Text style={{ color: COLORS.ERROR, fontSize: 11, fontWeight: "800", marginTop: 6 }}>
                  {error}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ item, isMine }: { item: ProjectMessage; isMine: boolean }) {
  return (
    <View style={{ alignItems: isMine ? "flex-end" : "flex-start" }}>
      <View
        style={{
          backgroundColor: isMine ? "#4F86E8" : COLORS.SURFACE,
          borderRadius: 12,
          borderTopRightRadius: isMine ? 12 : 12,
          borderWidth: isMine ? 0 : 1,
          borderColor: COLORS.BORDER_LIGHT,
          maxWidth: "82%",
          padding: 14,
          shadowColor: "#0F172A",
          shadowOpacity: isMine ? 0 : 0.05,
          shadowRadius: 12,
        }}
      >
        <Text style={{ color: isMine ? COLORS.TEXT_WHITE : "#4F86E8", fontSize: 12, fontWeight: "900", marginBottom: 4 }}>
          {isMine ? "You" : item.sender?.name || "Inkingi"}
        </Text>
        <Text style={{ color: isMine ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontSize: 15, lineHeight: 21 }}>
          {item.content}
        </Text>
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={{
              borderRadius: 10,
              height: 170,
              marginTop: 10,
              width: 210,
            }}
          />
        ) : null}
      </View>
      <Text
        style={{
          color: COLORS.TEXT_LIGHT,
          fontSize: 11,
          marginTop: 4,
          maxWidth: "82%",
          textAlign: isMine ? "right" : "left",
        }}
      >
        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
}

function QuickChip({ label, color }: { label: string; color: string }) {
  return (
    <Pressable
      onPress={() => {}}
      style={{
        backgroundColor: color,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 9,
      }}
    >
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function DottedBackground() {
  const dots = Array.from({ length: 156 }, (_, index) => index);
  return (
    <View
      pointerEvents="none"
      style={{
        bottom: 0,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        left: 0,
        opacity: 0.48,
        padding: 10,
        position: "absolute",
        right: 0,
        top: 0,
      }}
    >
      {dots.map((dot) => (
        <View
          key={dot}
          style={{
            backgroundColor: "#CBD5E1",
            borderRadius: 1,
            height: 2,
            width: 2,
          }}
        />
      ))}
    </View>
  );
}

const headerButtonStyle = {
  alignItems: "center" as const,
  backgroundColor: COLORS.SURFACE,
  borderRadius: 22,
  height: 44,
  justifyContent: "center" as const,
  width: 44,
};
