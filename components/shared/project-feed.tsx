import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Text, View } from "react-native";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

export type ProjectFeedItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  status?: string | null;
  createdAt: string;
  actor?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

const iconForType = (type: string): keyof typeof Ionicons.glyphMap => {
  if (type === "milestone") return "flag-outline";
  if (type === "progress") return "images-outline";
  if (type === "inspection") return "shield-checkmark-outline";
  if (type === "payment") return "card-outline";
  if (type === "rfq") return "receipt-outline";
  if (type === "purchase_order") return "document-text-outline";
  if (type === "delivery") return "cube-outline";
  if (type === "dispute") return "alert-circle-outline";
  if (type === "daily_report") return "calendar-outline";
  if (type === "inventory_log") return "layers-outline";
  if (type === "delivery_verification") return "checkmark-done-outline";
  if (type === "message") return "chatbubble-ellipses-outline";
  return "radio-button-on-outline";
};

const statusTone = (status?: string | null) => {
  const value = String(status || "").toLowerCase();
  if (["approved", "paid", "completed", "confirmed", "verified", "accepted"].includes(value)) {
    return { bg: COLORS.PRIMARY_LIGHT, fg: COLORS.PRIMARY_DARK };
  }
  if (["rejected", "revision_required", "failed", "cancelled", "open"].includes(value)) {
    return { bg: "#FEE2E2", fg: COLORS.ERROR };
  }
  return { bg: COLORS.MUTED, fg: COLORS.TEXT_SECONDARY };
};

export function ProjectFeed({ projectId, limit = 10 }: { projectId: string; limit?: number }) {
  const feedQuery = useQuery({
    queryKey: ["project-feed", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<ProjectFeedItem[]>(ENDPOINTS.PROJECTS.FEED(projectId))).data,
    refetchInterval: 10000,
  });

  const items = (feedQuery.data || []).slice(0, limit);

  return (
    <View style={styles.card}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.title}>Project feed</Text>
        {feedQuery.isFetching ? <ActivityIndicator color={COLORS.PRIMARY} size="small" /> : null}
      </View>
      {items.length === 0 && !feedQuery.isLoading ? (
        <Text style={styles.empty}>No project activity yet.</Text>
      ) : null}
      {feedQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 14 }} /> : null}
      <View style={{ gap: 0, marginTop: 10 }}>
        {items.map((item, index) => {
          const tone = statusTone(item.status);
          return (
            <View key={item.id} style={styles.feedRow}>
              <View style={styles.timeline}>
                <View style={styles.iconWrap}>
                  <Ionicons name={iconForType(item.type)} size={16} color={COLORS.PRIMARY} />
                </View>
                {index < items.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
                  <Text numberOfLines={1} style={styles.itemTitle}>{item.title}</Text>
                  {item.status ? (
                    <View style={[styles.status, { backgroundColor: tone.bg }]}>
                      <Text numberOfLines={1} style={[styles.statusText, { color: tone.fg }]}>
                        {String(item.status).replace(/_/g, " ")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {item.body ? <Text numberOfLines={2} style={styles.body}>{item.body}</Text> : null}
                <Text style={styles.meta}>
                  {item.actor?.name || "System"} • {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "900" as const,
  },
  empty: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  feedRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  timeline: {
    alignItems: "center" as const,
    width: 28,
  },
  iconWrap: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 999,
    height: 28,
    justifyContent: "center" as const,
    width: 28,
  },
  line: {
    backgroundColor: COLORS.BORDER_LIGHT,
    flex: 1,
    marginVertical: 3,
    width: 1,
  },
  itemTitle: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  body: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  meta: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 10,
    fontWeight: "700" as const,
    marginTop: 5,
  },
  status: {
    borderRadius: 999,
    maxWidth: 118,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
  },
};
