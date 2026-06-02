import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  createdAt: string;
};

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<NotificationItem[]>(ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api.put(ENDPOINTS.NOTIFICATIONS.DETAIL(id), { status: "read" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
        {/* Header with Back Button */}
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
            Notifications
          </Text>
        </View>

        <View style={{ gap: 6, marginBottom: 18 }}>
          <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
            Live project, account, and workflow alerts from the backend.
          </Text>
        </View>

        {notificationsQuery.isLoading ? (
          <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
            <ActivityIndicator color={COLORS.PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={notificationsQuery.data || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={notificationsQuery.isRefetching}
                onRefresh={notificationsQuery.refetch}
                tintColor={COLORS.PRIMARY}
              />
            }
            ListEmptyComponent={
              <EmptyState icon="notifications-off-outline" title="No notifications yet" />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => markRead.mutate(item.id)}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: item.status === "read" ? COLORS.BORDER_LIGHT : COLORS.PRIMARY_LIGHT,
                  borderRadius: 16,
                  borderWidth: 1,
                  padding: 16,
                }}
              >
                <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: item.status === "read" ? COLORS.MUTED : COLORS.PRIMARY_LIGHT,
                      borderRadius: 14,
                      height: 44,
                      justifyContent: "center",
                      width: 44,
                    }}
                  >
                    <Ionicons
                      name={item.channel === "push" ? "phone-portrait-outline" : "mail-outline"}
                      size={21}
                      color={COLORS.PRIMARY_DARK}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 4 }}>
                      {item.body}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, marginTop: 8 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
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
      <Ionicons name={icon} size={38} color={COLORS.TEXT_LIGHT} />
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900", marginTop: 12 }}>
        {title}
      </Text>
    </View>
  );
}
