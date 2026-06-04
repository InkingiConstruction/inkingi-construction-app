import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { formatRWF } from "@/utils/projectFunds";

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_full_payment"
  | "resolved_partial"
  | "resolved_refund"
  | "resolved_termination"
  | "closed";

type ClientDispute = {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  category: "quality" | "timeline" | "cost" | "other";
  description: string;
  status: DisputeStatus;
  amountInDispute: string | number;
  resolution?: any;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name?: string | null };
  milestone?: { id: string; name?: string | null };
  raisedBy?: { name?: string | null; role?: string | null };
  evidence?: {
    id: string;
    cloudinaryUrl: string;
    description?: string | null;
    createdAt: string;
    uploadedBy?: { name?: string | null; role?: string | null };
  }[];
};

const isResolved = (status: DisputeStatus) =>
  status.startsWith("resolved") || status === "closed";

const statusLabel = (status: string) => status.replace(/_/g, " ").toUpperCase();

export default function DisputesScreen() {
  const params = useLocalSearchParams<{ disputeId?: string }>();
  const [selectedDisputeId, setSelectedDisputeId] = useState(params.disputeId || "");

  const disputesQuery = useQuery({
    queryKey: ["client-disputes"],
    queryFn: async () => (await api.get<ClientDispute[]>(ENDPOINTS.DISPUTES.LIST)).data,
  });

  const disputes = disputesQuery.data || [];
  const activeDispute = useMemo(
    () => disputes.find((item) => item.id === selectedDisputeId) || disputes[0],
    [disputes, selectedDisputeId],
  );

  const timeline = activeDispute
    ? [
        {
          date: activeDispute.createdAt,
          title: "Dispute Submitted",
          desc: `${activeDispute.raisedBy?.name || "Project member"} raised a ${activeDispute.category} dispute.`,
        },
        ...(activeDispute.status === "under_review"
          ? [
              {
                date: activeDispute.updatedAt,
                title: "Under Review",
                desc: "The dispute is being reviewed by the assigned resolution team.",
              },
            ]
          : []),
        ...(isResolved(activeDispute.status)
          ? [
              {
                date: activeDispute.resolvedAt || activeDispute.updatedAt,
                title: "Resolution Issued",
                desc:
                  typeof activeDispute.resolution === "string"
                    ? activeDispute.resolution
                    : "A resolution has been recorded for this dispute.",
              },
            ]
          : []),
      ]
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={disputesQuery.isRefetching} onRefresh={disputesQuery.refetch} tintColor={COLORS.PRIMARY} />}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <ClientTopBar
            title="Dispute Center"
            subtitle="Track milestone conflicts and resolution status."
            back
          />
        </View>

        {disputesQuery.isLoading ? (
          <View style={{ alignItems: "center", justifyContent: "center", padding: 48 }}>
            <ActivityIndicator color={COLORS.PRIMARY} size="large" />
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 12 }}>Loading disputes...</Text>
          </View>
        ) : disputes.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_LIGHT} />
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 12, textAlign: "center", lineHeight: 20 }}>
              No active disputes. Disputes are initiated from milestones when there is a conflict on payment or building quality.
            </Text>
            <Pressable
              onPress={() => router.push("/(client)/milestones" as never)}
              style={styles.primaryButton}
            >
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold" }}>View Milestones</Text>
            </Pressable>
          </View>
        ) : activeDispute ? (
          <View style={{ gap: 20 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {disputes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedDisputeId(item.id)}
                  style={{
                    backgroundColor: activeDispute.id === item.id ? COLORS.PRIMARY : COLORS.SURFACE,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: activeDispute.id === item.id ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY,
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {item.project?.name || "Project"} - {statusLabel(item.status)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: COLORS.PRIMARY, fontWeight: "900" }}>
                    DISPUTE ID: {activeDispute.id}
                  </Text>
                  <StatusBadge status={activeDispute.status} />
                </View>

                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 8 }}>
                  Conflict: {activeDispute.milestone?.name || "Project issue"}
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, marginTop: 4 }}>
                  Project:{" "}
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold" }}>
                    {activeDispute.project?.name || "Project"}
                  </Text>
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 10 }}>
                  {activeDispute.description}
                </Text>

                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>AMOUNT IN DISPUTE</Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.ERROR, marginTop: 2 }}>
                      {formatRWF(Number(activeDispute.amountInDispute || 0))}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.summaryLabel}>CATEGORY</Text>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginTop: 2 }}>
                      {activeDispute.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Resolution Owner</Text>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 10 }}>
                  <View style={styles.avatar}>
                    <Ionicons name="person-circle-outline" size={24} color={COLORS.PRIMARY_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 14 }}>
                      IER Resolution Team
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                      Status: {statusLabel(activeDispute.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {activeDispute.evidence && activeDispute.evidence.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Evidence Files</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
                    {activeDispute.evidence.map((item, idx) => (
                      <View key={item.id} style={{ position: "relative" }}>
                        <Image
                          source={{ uri: item.cloudinaryUrl }}
                          style={{ width: 120, height: 90, borderRadius: 8, backgroundColor: COLORS.MUTED }}
                        />
                        <View style={styles.photoBadge}>
                          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 9 }}>Proof #{idx + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Resolution Timeline</Text>
                <View style={{ gap: 16, marginTop: 14 }}>
                  {timeline.map((event, idx) => (
                    <View key={`${event.title}-${idx}`} style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center" }}>
                        <View style={styles.timelineDot}>
                          <Ionicons
                            name={idx === 0 ? "checkmark" : "time-outline"}
                            size={12}
                            color={idx === 0 ? COLORS.PRIMARY : COLORS.TEXT_LIGHT}
                          />
                        </View>
                        {idx < timeline.length - 1 && (
                          <View style={{ width: 1, flex: 1, backgroundColor: COLORS.BORDER, marginVertical: 4 }} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                          {event.title}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 2 }}>
                          {new Date(event.date).toLocaleDateString()} at{" "}
                          {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                          {event.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: DisputeStatus }) {
  const resolved = isResolved(status);
  return (
    <View
      style={{
        backgroundColor: resolved ? "#DCFCE7" : status === "under_review" ? "#FEF3C7" : "#FEE2E2",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: resolved ? COLORS.SUCCESS : status === "under_review" ? COLORS.WARNING : COLORS.ERROR,
          fontSize: 10,
          fontWeight: "900",
        }}
      >
        {statusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryRow: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    fontWeight: "800",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.BORDER,
    borderWidth: 1,
  },
});
