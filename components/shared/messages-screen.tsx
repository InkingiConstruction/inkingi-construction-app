import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  editedAt?: string | null;
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
  unreadCount?: number;
};

const firstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export function MessagesScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    recipientId?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientRole?: string;
    projectId?: string;
  }>();
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [handledDirectRecipientId, setHandledDirectRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState("");
  const [editingMessage, setEditingMessage] = useState<ProjectMessage | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<ProjectMessage | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [search, setSearch] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const response = await api.get<ChatConversation[]>(
        ENDPOINTS.MESSAGES.CONVERSATIONS,
      );
      return response.data;
    },
  });

  const conversations = conversationsQuery.data || [];
  const directRecipientId = firstParam(params.recipientId);
  const directRecipientName = firstParam(params.recipientName);
  const directRecipientEmail = firstParam(params.recipientEmail);
  const directRecipientRole = firstParam(params.recipientRole);
  const directProjectId = firstParam(params.projectId);

  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const participantText = conversation.participants
        .map(
          (participant) =>
            `${participant.name} ${participant.email} ${participant.role}`,
        )
        .join(" ");
      return `${conversation.title} ${conversation.subtitle || ""} ${participantText}`
        .toLowerCase()
        .includes(needle);
    });
  }, [conversations, search]);
  const pendingDirectConversation = useMemo<ChatConversation | null>(() => {
    if (!directRecipientId) return null;

    return {
      id: `direct:${directRecipientId}`,
      type: "direct",
      recipientId: directRecipientId,
      projectId: directProjectId,
      title: directRecipientName || directRecipientEmail || "Direct chat",
      subtitle: directRecipientRole || "Direct message",
      participants: [
        {
          id: directRecipientId,
          name: directRecipientName || directRecipientEmail || "Direct chat",
          email: directRecipientEmail || "",
          role: directRecipientRole || "user",
        },
      ],
      lastMessage: null,
      unreadCount: 0,
    };
  }, [
    directProjectId,
    directRecipientEmail,
    directRecipientId,
    directRecipientName,
    directRecipientRole,
  ]);
  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ||
    (selectedConversationId === pendingDirectConversation?.id
      ? pendingDirectConversation
      : undefined);

  useEffect(() => {
    if (
      !directRecipientId ||
      handledDirectRecipientId === directRecipientId ||
      conversationsQuery.isLoading
    ) {
      return;
    }

    const existingConversation = conversations.find(
      (conversation) =>
        conversation.type === "direct" &&
        conversation.recipientId === directRecipientId,
    );

    setSelectedConversationId(
      existingConversation?.id || `direct:${directRecipientId}`,
    );
    setHandledDirectRecipientId(directRecipientId);
    setError("");
  }, [
    conversations,
    conversationsQuery.isLoading,
    directRecipientId,
    handledDirectRecipientId,
  ]);

  const messagesQueryKey = [
    "messages",
    activeConversation?.id,
    activeConversation?.recipientId,
    activeConversation?.projectId,
  ];

  const messagesQuery = useQuery({
    queryKey: messagesQueryKey,
    enabled: Boolean(activeConversation),
    queryFn: async () => {
      const response = await api.get<ProjectMessage[]>(
        ENDPOINTS.MESSAGES.LIST,
        {
          params:
            activeConversation?.type === "group"
              ? { projectId: activeConversation.projectId }
              : { recipientId: activeConversation?.recipientId },
        },
      );
      return response.data;
    },
  });

  const messages = messagesQuery.data || [];
  const activeTitle = activeConversation?.title || "Chat Messages";
  const activeSubtitle = useMemo(() => {
    if (!activeConversation) return "Select a conversation";
    if (activeConversation.type === "direct")
      return activeConversation.subtitle || "Direct message";
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
      const fileName =
        image.fileName || image.uri.split("/").pop() || "chat-image.jpg";
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

  const editMessage = useMutation({
    mutationFn: async () => {
      if (!editingMessage) throw new Error("Select a message to edit.");
      const nextContent = content.trim();
      if (!nextContent) throw new Error("Message cannot be empty.");

      return api.put(ENDPOINTS.MESSAGES.DETAIL(editingMessage.id), {
        content: nextContent,
        photoUrl: editingMessage.photoUrl,
      });
    },
    onSuccess: () => {
      setContent("");
      setEditingMessage(null);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to edit message");
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) =>
      api.delete(ENDPOINTS.MESSAGES.DETAIL(messageId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete message");
    },
  });

  const submit = () => {
    if (editingMessage) {
      editMessage.mutate();
      return;
    }

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

  const startEdit = (message: ProjectMessage) => {
    setEditingMessage(message);
    setContent(message.content);
    setImage(null);
    setError("");
  };

  const confirmDelete = (message: ProjectMessage) => {
    Alert.alert("Delete message", "Delete this message for everyone?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMessage.mutate(message.id),
      },
    ]);
  };

  const downloadPreviewImage = async () => {
    if (!previewImage?.photoUrl) return;

    try {
      const extension =
        previewImage.photoUrl.split("?")[0].split(".").pop() || "jpg";
      const target = `${FileSystem.documentDirectory}inkingi-chat-${previewImage.id}.${extension}`;
      const result = await FileSystem.downloadAsync(
        previewImage.photoUrl,
        target,
      );
      Alert.alert(
        "Image downloaded",
        `Saved inside the app files:\n${result.uri}`,
      );
    } catch (err) {
      Alert.alert(
        "Download failed",
        err instanceof Error ? err.message : "Try again.",
      );
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: activeConversation ? "#EEF2EF" : COLORS.BACKGROUND,
      }}
    >
      <StatusBar hidden={false} style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: activeConversation ? "#EEF2EF" : COLORS.BACKGROUND,
          }}
        >
          {!activeConversation ? (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderBottomColor: COLORS.BORDER_LIGHT,
                  borderBottomWidth: 1,
                  paddingBottom: 14,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingTop: 4,
                  }}
                >
                  <Pressable
                    onPress={() => router.back()}
                    style={{
                      alignItems: "center",
                      borderRadius: 999,
                      height: 36,
                      justifyContent: "center",
                      width: 36,
                    }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={22}
                      color={COLORS.PRIMARY_DARK}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.TEXT_PRIMARY,
                        fontSize: 22,
                        fontWeight: "900",
                      }}
                    >
                      Chat
                    </Text>
                    <Text
                      style={{
                        color: COLORS.TEXT_SECONDARY,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Project groups and direct messages
                    </Text>
                  </View>
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.PRIMARY_LIGHT,
                      borderRadius: 999,
                      height: 36,
                      justifyContent: "center",
                      width: 36,
                    }}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={19}
                      color={COLORS.PRIMARY_DARK}
                    />
                  </View>
                </View>

                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.MUTED,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderRadius: 12,
                    borderWidth: 1,
                    flexDirection: "row",
                    gap: 8,
                    marginHorizontal: 16,
                    marginTop: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={17}
                    color={COLORS.TEXT_LIGHT}
                  />
                  <TextInput
                    onChangeText={setSearch}
                    placeholder="Search messages"
                    placeholderTextColor={COLORS.TEXT_LIGHT}
                    style={{
                      color: COLORS.TEXT_PRIMARY,
                      flex: 1,
                      fontSize: 13,
                      padding: 0,
                    }}
                    value={search}
                  />
                </View>
              </View>

              {conversationsQuery.isLoading ? (
                <View
                  style={{
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color={COLORS.PRIMARY} />
                </View>
              ) : (
                <FlatList
                  data={filteredConversations}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{
                    gap: 10,
                    padding: 16,
                    paddingBottom: 120,
                  }}
                  refreshControl={
                    <RefreshControl
                      refreshing={conversationsQuery.isRefetching}
                      onRefresh={conversationsQuery.refetch}
                      tintColor={COLORS.PRIMARY}
                    />
                  }
                  ListEmptyComponent={
                    <Text
                      style={{
                        color: COLORS.TEXT_SECONDARY,
                        padding: 24,
                        textAlign: "center",
                      }}
                    >
                      No chats available.
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <ConversationRow
                      conversation={item}
                      currentUserId={user?.id}
                      onPress={() => {
                        setSelectedConversationId(item.id);
                        setError("");
                      }}
                    />
                  )}
                />
              )}
            </View>
          ) : (
            <>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.SURFACE,
                  borderBottomColor: COLORS.BORDER_LIGHT,
                  borderBottomWidth: 1,
                  flexDirection: "row",
                  gap: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
              >
                <Pressable
                  onPress={() => {
                    setSelectedConversationId("");
                    setEditingMessage(null);
                    setContent("");
                    setImage(null);
                  }}
                  style={{
                    alignItems: "center",
                    borderRadius: 999,
                    height: 36,
                    justifyContent: "center",
                    width: 36,
                  }}
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={COLORS.PRIMARY_DARK}
                  />
                </Pressable>
                <Avatar
                  conversation={activeConversation}
                  currentUserId={user?.id}
                  size={36}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: COLORS.TEXT_PRIMARY,
                      fontSize: 15,
                      fontWeight: "900",
                    }}
                  >
                    {activeTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11 }}
                  >
                    {activeConversation.type === "group"
                      ? activeSubtitle
                      : "Online"}
                  </Text>
                </View>
                <Pressable
                  style={{
                    alignItems: "center",
                    borderRadius: 999,
                    height: 36,
                    justifyContent: "center",
                    width: 36,
                  }}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color={COLORS.TEXT_SECONDARY}
                  />
                </Pressable>
              </View>

              {messagesQuery.isLoading ? (
                <View
                  style={{
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color={COLORS.PRIMARY} />
                </View>
              ) : (
                <FlatList
                  data={messages}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{
                    gap: 8,
                    paddingBottom: 98,
                    paddingHorizontal: 14,
                    paddingTop: 16,
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
                      <Ionicons
                        name="chatbubbles-outline"
                        size={32}
                        color={COLORS.TEXT_LIGHT}
                      />
                      <Text
                        style={{
                          color: COLORS.TEXT_PRIMARY,
                          fontSize: 16,
                          fontWeight: "900",
                          marginTop: 14,
                        }}
                      >
                        No messages yet
                      </Text>
                      <Text
                        style={{
                          color: COLORS.TEXT_SECONDARY,
                          lineHeight: 20,
                          marginTop: 6,
                          textAlign: "center",
                        }}
                      >
                        Send the first message in this chat.
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const isMine = item.sender?.id === user?.id;
                    return (
                      <ChatBubble
                        item={item}
                        isMine={isMine}
                        onDelete={confirmDelete}
                        onEdit={startEdit}
                        onOpenImage={setPreviewImage}
                      />
                    );
                  }}
                />
              )}

              <View
                style={{
                  bottom: 10,
                  left: 10,
                  position: "absolute",
                  right: 10,
                }}
              >
                {showMentions ? (
                  <View
                    style={{
                      backgroundColor: COLORS.SURFACE,
                      borderColor: COLORS.BORDER_LIGHT,
                      borderRadius: 18,
                      borderWidth: 1,
                      marginBottom: 8,
                      padding: 8,
                    }}
                  >
                    <FlatList
                      data={mentionParticipants}
                      horizontal
                      keyExtractor={(item) => item.id}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                      ListEmptyComponent={
                        <Text
                          style={{
                            color: COLORS.TEXT_LIGHT,
                            fontSize: 12,
                            paddingHorizontal: 8,
                          }}
                        >
                          No one to tag in this chat
                        </Text>
                      }
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => insertMention(item)}
                          style={{
                            alignItems: "center",
                            backgroundColor: COLORS.PRIMARY_LIGHT,
                            borderRadius: 999,
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
                            <Text
                              style={{
                                color: COLORS.PRIMARY_DARK,
                                fontSize: 10,
                                fontWeight: "900",
                              }}
                            >
                              {(item.name || item.email)
                                .slice(0, 1)
                                .toUpperCase()}
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
                  </View>
                ) : null}
                {image ? (
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.SURFACE,
                      borderColor: COLORS.BORDER_LIGHT,
                      borderRadius: 18,
                      borderWidth: 1,
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
                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.TEXT_PRIMARY,
                        flex: 1,
                        fontWeight: "700",
                      }}
                    >
                      {image.fileName || "Selected image"}
                    </Text>
                    <Pressable onPress={() => setImage(null)}>
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </Pressable>
                  </View>
                ) : null}
                {editingMessage ? (
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.SURFACE,
                      borderColor: COLORS.BORDER_LIGHT,
                      borderLeftColor: COLORS.PRIMARY,
                      borderLeftWidth: 3,
                      borderRadius: 18,
                      borderWidth: 1,
                      flexDirection: "row",
                      gap: 10,
                      marginBottom: 8,
                      padding: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: COLORS.PRIMARY_DARK,
                          fontSize: 12,
                          fontWeight: "900",
                        }}
                      >
                        Editing message
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.TEXT_SECONDARY,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {editingMessage.content}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setEditingMessage(null);
                        setContent("");
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </Pressable>
                  </View>
                ) : null}
                <View
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 7,
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: COLORS.SURFACE,
                      borderColor: COLORS.BORDER_LIGHT,
                      borderRadius: 999,
                      borderWidth: 1,
                      flex: 1,
                      flexDirection: "row",
                      gap: 2,
                      minHeight: 56,
                      paddingLeft: 14,
                      paddingRight: 8,
                      shadowColor: "#0F172A",
                      shadowOpacity: 0.06,
                      shadowRadius: 12,
                    }}
                  >
                    <Pressable
                      disabled={Boolean(editingMessage)}
                      onPress={pickImage}
                      style={{
                        alignItems: "center",
                        height: 44,
                        justifyContent: "center",
                        width: 40,
                      }}
                    >
                      <Ionicons
                        name="attach-outline"
                        size={25}
                        color={COLORS.PRIMARY_DARK}
                      />
                    </Pressable>
                    <TextInput
                      multiline
                      onChangeText={setContent}
                      placeholder="Message"
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      style={{
                        color: COLORS.TEXT_PRIMARY,
                        flex: 1,
                        fontSize: 16,
                        maxHeight: 108,
                        minHeight: 50,
                        paddingHorizontal: 8,
                        paddingVertical: 13,
                      }}
                      value={content}
                    />
                    <Pressable
                      onPress={() => setShowMentions((current) => !current)}
                      style={{
                        alignItems: "center",
                        backgroundColor: showMentions
                          ? COLORS.PRIMARY_LIGHT
                          : "transparent",
                        borderRadius: 999,
                        height: 42,
                        justifyContent: "center",
                        width: 42,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.PRIMARY_DARK,
                          fontSize: 21,
                          fontWeight: "900",
                        }}
                      >
                        @
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    disabled={sendMessage.isPending || editMessage.isPending}
                    onPress={submit}
                    style={{
                      alignItems: "center",
                      backgroundColor:
                        content.trim() || image || editingMessage
                          ? COLORS.PRIMARY_DARK
                          : "#DADADA",
                      borderRadius: 999,
                      height: 56,
                      justifyContent: "center",
                      opacity:
                        sendMessage.isPending || editMessage.isPending
                          ? 0.7
                          : 1,
                      shadowColor: "#0F172A",
                      shadowOpacity: 0.12,
                      shadowRadius: 10,
                      width: 56,
                    }}
                  >
                    <Ionicons
                      name={
                        editingMessage ? "checkmark-outline" : "send-outline"
                      }
                      size={23}
                      color={COLORS.TEXT_WHITE}
                    />
                  </Pressable>
                </View>
                {error ? (
                  <Text
                    style={{
                      color: COLORS.ERROR,
                      fontSize: 11,
                      fontWeight: "800",
                      marginTop: 6,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}
              </View>
            </>
          )}
          <ImagePreviewModal
            message={previewImage}
            onClose={() => setPreviewImage(null)}
            onDownload={downloadPreviewImage}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation,
  currentUserId,
  onPress,
}: {
  conversation: ChatConversation;
  currentUserId?: string;
  onPress: () => void;
}) {
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;
  const time = lastMessage
    ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 14,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        minHeight: 72,
        paddingHorizontal: 12,
        paddingVertical: 11,
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowRadius: 10,
      }}
    >
      <Avatar
        conversation={conversation}
        currentUserId={currentUserId}
        size={46}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: COLORS.TEXT_PRIMARY,
            fontSize: 15,
            fontWeight: "900",
          }}
        >
          {conversation.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}
        >
          {lastMessage?.content ||
            conversation.subtitle ||
            (conversation.type === "group"
              ? "Project group chat"
              : "Direct message")}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: COLORS.TEXT_LIGHT,
            fontSize: 10,
            fontWeight: "800",
            marginTop: 5,
            textTransform: "uppercase",
          }}
        >
          {conversation.type === "group" ? "Project group" : "Direct chat"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10 }}>{time}</Text>
        {unreadCount > 0 ? (
          <View
            style={{
              alignItems: "center",
              backgroundColor: COLORS.PRIMARY,
              borderRadius: 999,
              height: 20,
              justifyContent: "center",
              minWidth: 20,
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                color: COLORS.TEXT_WHITE,
                fontSize: 10,
                fontWeight: "900",
              }}
            >
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Avatar({
  conversation,
  currentUserId,
  size,
}: {
  conversation: ChatConversation;
  currentUserId?: string;
  size: number;
}) {
  const participant =
    conversation.participants.find((item) => item.id !== currentUserId) ||
    conversation.participants[0];
  const image = conversation.type === "direct" ? participant?.image : undefined;
  const label =
    conversation.type === "group"
      ? conversation.title
      : participant?.name || participant?.email || conversation.title;

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor:
          conversation.type === "group" ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
        borderColor:
          conversation.type === "group"
            ? "rgba(5,150,105,0.18)"
            : COLORS.BORDER_LIGHT,
        borderRadius: size / 2,
        borderWidth: 1,
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <Text
        style={{
          color: COLORS.PRIMARY_DARK,
          fontSize: Math.max(11, size * 0.32),
          fontWeight: "900",
        }}
      >
        {label.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

function ChatBubble({
  item,
  isMine,
  onDelete,
  onEdit,
  onOpenImage,
}: {
  item: ProjectMessage;
  isMine: boolean;
  onDelete: (message: ProjectMessage) => void;
  onEdit: (message: ProjectMessage) => void;
  onOpenImage: (message: ProjectMessage) => void;
}) {
  return (
    <View style={{ alignItems: isMine ? "flex-end" : "flex-start" }}>
      <View
        style={{
          backgroundColor: isMine ? COLORS.PRIMARY_DARK : COLORS.SURFACE,
          borderColor: isMine ? COLORS.PRIMARY_DARK : COLORS.BORDER_LIGHT,
          borderRadius: 16,
          borderBottomLeftRadius: isMine ? 16 : 4,
          borderBottomRightRadius: isMine ? 4 : 16,
          borderWidth: 1,
          maxWidth: "80%",
          paddingHorizontal: 12,
          paddingVertical: 8,
          shadowColor: "#0F172A",
          shadowOpacity: isMine ? 0.03 : 0.06,
          shadowRadius: 10,
        }}
      >
        {!isMine ? (
          <Text
            style={{
              color: COLORS.PRIMARY_DARK,
              fontSize: 11,
              fontWeight: "900",
              marginBottom: 3,
            }}
          >
            {item.sender?.name || "Inkingi"}
          </Text>
        ) : null}
        <Text
          style={{
            color: isMine ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {item.content}
        </Text>
        {item.photoUrl ? (
          <Pressable onPress={() => onOpenImage(item)}>
            <Image
              source={{ uri: item.photoUrl }}
              style={{
                borderRadius: 12,
                height: 160,
                marginTop: 10,
                width: 214,
              }}
            />
          </Pressable>
        ) : null}
      </View>
      {isMine ? (
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 4,
            paddingHorizontal: 6,
          }}
        >
          <Pressable onPress={() => onEdit(item)}>
            <Text
              style={{
                color: COLORS.PRIMARY_DARK,
                fontSize: 11,
                fontWeight: "900",
              }}
            >
              Edit
            </Text>
          </Pressable>
          <Pressable onPress={() => onDelete(item)}>
            <Text
              style={{ color: COLORS.ERROR, fontSize: 11, fontWeight: "900" }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      ) : null}
      <Text
        style={{
          color: COLORS.TEXT_LIGHT,
          fontSize: 10,
          marginTop: 4,
          maxWidth: "82%",
          paddingHorizontal: 6,
          textAlign: isMine ? "right" : "left",
        }}
      >
        {new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {item.editedAt
          ? ` · edited ${new Date(item.editedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : ""}
      </Text>
    </View>
  );
}

function ImagePreviewModal({
  message,
  onClose,
  onDownload,
}: {
  message: ProjectMessage | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(message?.photoUrl)}
    >
      <View style={{ backgroundColor: "#050505", flex: 1 }}>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 18,
          }}
        >
          <Pressable onPress={onClose} style={previewButtonStyle}>
            <Ionicons
              name="close-outline"
              size={25}
              color={COLORS.TEXT_WHITE}
            />
          </Pressable>
          <Text
            numberOfLines={1}
            style={{
              color: COLORS.TEXT_WHITE,
              flex: 1,
              fontWeight: "900",
              marginHorizontal: 12,
            }}
          >
            {message?.sender?.name || "Chat image"}
          </Text>
          <Pressable onPress={onDownload} style={previewButtonStyle}>
            <Ionicons
              name="download-outline"
              size={22}
              color={COLORS.TEXT_WHITE}
            />
          </Pressable>
        </View>
        {message?.photoUrl ? (
          <Image
            resizeMode="contain"
            source={{ uri: message.photoUrl }}
            style={{ flex: 1, width: "100%" }}
          />
        ) : null}
      </View>
    </Modal>
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

const previewButtonStyle = {
  alignItems: "center" as const,
  backgroundColor: "rgba(255,255,255,0.16)",
  borderRadius: 20,
  height: 40,
  justifyContent: "center" as const,
  width: 40,
};
