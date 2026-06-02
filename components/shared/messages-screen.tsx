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
  recipient?: {
    id: string;
    name: string;
    role: string;
  } | null;
  project?: {
    name?: string;
  } | null;
};

type ChatParticipant = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

type ChatConversation = {
  id: string;
  type: "group" | "direct";
  projectId?: string;
  recipientId?: string;
  title: string;
  subtitle?: string;
  participants: ChatParticipant[];
  lastMessage?: ProjectMessage | null;
};

export function MessagesScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState("");
  const [showMentions, setShowMentions] = useState(false);

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const response = await api.get<ChatConversation[]>(ENDPOINTS.MESSAGES.CONVERSATIONS);
      return response.data;
    },
  });

  const conversations = conversationsQuery.data || [];
  const activeConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ||
    conversations[0];

  const messagesQuery = useQuery({
    queryKey: ["messages", activeConversation?.id],
    enabled: Boolean(activeConversation),
    queryFn: async () => {
      const response = await api.get<ProjectMessage[]>(ENDPOINTS.MESSAGES.LIST, {
        params:
          activeConversation?.type === "group"
            ? { projectId: activeConversation.projectId }
            : { recipientId: activeConversation?.recipientId },
      });
      return response.data;
    },
  });

  const messages = messagesQuery.data || [];
  const activeTitle = activeConversation?.title || "Select Chat";
  const activeSubtitle = useMemo(() => {
    if (!activeConversation) return "No conversation selected";
    if (activeConversation.type === "direct") return activeConversation.subtitle || "Direct message";
    const members = activeConversation.participants
      .filter((participant) => participant.id !== user?.id)
      .map((participant) => participant.name || participant.email)
      .slice(0, 3);
    return members.length ? members.join(", ") : "Project group";
  }, [activeConversation, user?.id]);
  const mentionParticipants = useMemo(() => {
    return (activeConversation?.participants || []).filter(
      (participant) => participant.id !== user?.id,
    );
  }, [activeConversation?.participants, user?.id]);

  const insertMention = (participant: ChatParticipant) => {
    const name = participant.name || participant.email;
    const mention = `@${name.split(" ")[0]}`;
    const spacer = content.trim().length ? " " : "";

    setContent((current) => `${current}${spacer}${mention} `);
    setShowMentions(false);
  };

  const sendMessage = useMutation({
    mutationFn: () => {
      if (!image) {
        return api.post(ENDPOINTS.MESSAGES.CREATE, {
          ...(activeConversation?.type === "group"
            ? { projectId: activeConversation.projectId }
            : { recipientId: activeConversation?.recipientId }),
          content: content.trim(),
        });
      }

      const formData = new FormData();
      const fileName = image.fileName || image.uri.split("/").pop() || "chat-image.jpg";
      const mimeType = image.mimeType || "image/jpeg";

      if (activeConversation?.type === "group") {
        formData.append("projectId", String(activeConversation.projectId));
      } else {
        formData.append("recipientId", String(activeConversation?.recipientId));
      }
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
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to send message");
    },
  });

  const submit = () => {
    if (!activeConversation || (!content.trim() && !image)) {
      setError("Select a chat and add a message or image");
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
                gap: 6,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text numberOfLines={1} style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "800", maxWidth: 150 }}>
                {activeTitle}
              </Text>
              <Text numberOfLines={1} style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, maxWidth: 180 }}>
                {activeConversation?.type === "group" ? "Group" : "Direct"} · {activeSubtitle}
              </Text>
            </View>
            <Pressable style={headerButtonStyle}>
              <Ionicons name="ellipsis-horizontal" size={21} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
          </View>

          {conversationsQuery.isLoading || messagesQuery.isLoading ? (
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
                    Open a project group or direct chat and start the conversation.
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
                data={conversations}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                ListEmptyComponent={
                  <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, paddingHorizontal: 8 }}>
                    No chats available
                  </Text>
                }
                renderItem={({ item }) => {
                  const selected = item.id === activeConversation?.id;
                  return (
                    <Pressable
                      onPress={() => setSelectedConversationId(item.id)}
                      style={{
                        backgroundColor: selected ? COLORS.PRIMARY : "#EEF2F7",
                        borderRadius: 14,
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Ionicons
                        name={item.type === "group" ? "people-outline" : "person-outline"}
                        size={14}
                        color={selected ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          color: selected ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY,
                          fontSize: 12,
                          fontWeight: "800",
                          maxWidth: 130,
                        }}
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  );
                }}
              />
              {showMentions ? (
                <FlatList
                  data={mentionParticipants}
                  horizontal
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                  ListEmptyComponent={
                    <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, paddingHorizontal: 8 }}>
                      No one to tag in this chat
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => insertMention(item)}
                      style={{
                        alignItems: "center",
                        backgroundColor: COLORS.PRIMARY_LIGHT,
                        borderRadius: 14,
                        flexDirection: "row",
                        gap: 7,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <View
                        style={{
                          alignItems: "center",
                          backgroundColor: COLORS.SURFACE,
                          borderRadius: 11,
                          height: 22,
                          justifyContent: "center",
                          width: 22,
                        }}
                      >
                        <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 10, fontWeight: "900" }}>
                          {(item.name || item.email).slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.PRIMARY_DARK,
                          fontSize: 12,
                          fontWeight: "900",
                          maxWidth: 120,
                        }}
                      >
                        {item.name || item.email}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : null}
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
                <Pressable
                  onPress={() => setShowMentions((current) => !current)}
                  style={{
                    alignItems: "center",
                    backgroundColor: showMentions ? COLORS.PRIMARY_LIGHT : "transparent",
                    borderRadius: 14,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                  }}
                >
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 18, fontWeight: "900" }}>@</Text>
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
