import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorMilestone } from "@/components/supervisor/supervisor-types";

type SupervisorMilestoneDetail = SupervisorMilestone & {
  durationDays?: number | null;
  acceptanceCriteria?: string | null;
  description?: string | null;
  project?: SupervisorMilestone["project"] & {
    architecturalPlans?: Array<{
      id?: string;
      cloudinaryUrl?: string | null;
      url?: string | null;
      name?: string | null;
      originalName?: string | null;
    }>;
  };
  boqItems?: {
    id: string;
    category: string;
    name: string;
    quantity: string | number;
    unit: string;
    unitPrice: string | number;
    totalPrice: string | number;
    notes?: string | null;
  }[];
  inspections?: {
    id: string;
    decision?: string | null;
    notes?: string | null;
    rating?: number | null;
    createdAt?: string;
  }[];
  progressPhotos?: {
    id: string;
    caption?: string | null;
    cloudinaryUrl?: string | null;
    url?: string | null;
    isVideo?: boolean | null;
  }[];
};

const parseCriteria = (value?: string | null) =>
  (value || "")
    .split(/\n+/)
    .map((item) => item.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

export default function SupervisorInspections() {
  const params = useLocalSearchParams<{ projectId?: string; milestoneId?: string }>();
  const queryClient = useQueryClient();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(params.milestoneId || "");
  const [sheetOpen, setSheetOpen] = useState(Boolean(params.milestoneId));
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("5");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [criteriaChecks, setCriteriaChecks] = useState<Record<string, "pass" | "fix">>({});

  const milestonesQuery = useQuery({
    queryKey: ["supervisor-milestones", params.projectId],
    queryFn: async () => {
      const response = await api.get<SupervisorMilestone[]>(ENDPOINTS.MILESTONES.LIST, {
        params: params.projectId ? { projectId: params.projectId } : undefined,
      });
      return response.data;
    },
    refetchInterval: 10000,
  });

  const selectedMilestoneQuery = useQuery({
    queryKey: ["supervisor-milestone-detail", selectedMilestoneId],
    enabled: Boolean(selectedMilestoneId),
    queryFn: async () =>
      (await api.get<SupervisorMilestoneDetail>(ENDPOINTS.MILESTONES.DETAIL(selectedMilestoneId))).data,
    refetchInterval: 10000,
  });

  const inspectMutation = useMutation({
    mutationFn: (decision: "approved" | "revision_required") =>
      api.post(ENDPOINTS.INSPECTIONS.CREATE, {
        milestoneId: selectedMilestoneId,
        notes: notes.trim(),
        rating: Number(rating) || undefined,
        decision,
        checklist: {
          structureQuality: decision === "approved",
          siteSafety: decision === "approved",
          documentationReviewed: true,
          acceptanceCriteria: criteriaChecks,
        },
      }),
    onSuccess: () => {
      setError("");
      setNotes("");
      setSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ["supervisor-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-milestone-detail", selectedMilestoneId] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["engineer-milestones"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Inspection failed");
    },
  });

  const submit = (decision: "approved" | "revision_required") => {
    if (!selectedMilestoneId) {
      setError("Select a milestone to inspect");
      return;
    }

    inspectMutation.mutate(decision);
  };

  const openMilestone = (id: string) => {
    setSelectedMilestoneId(id);
    setCriteriaChecks({});
    setSheetOpen(true);
  };

  const toggleCriterion = (criterion: string, value: "pass" | "fix") => {
    setCriteriaChecks((current) => ({ ...current, [criterion]: value }));
  };

  const refresh = async () => {
    setRefreshing(true);
    await milestonesQuery.refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={milestonesQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 160 }}
        ListHeaderComponent={
          <View>
            <SupervisorTopBar
              title="Inspect"
              subtitle="Approve a milestone or request revision from the assigned project."
            />
          </View>
        }
        ListEmptyComponent={
          milestonesQuery.isLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 30 }} />
          ) : (
            <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
              No milestones found for this project.
            </Text>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openMilestone(item.id)}
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 10,
              borderWidth: 1,
              padding: 15,
            }}
          >
            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
              <Ionicons
                name="clipboard-outline"
                size={22}
                color={COLORS.PRIMARY}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.name}</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  Status: {item.status}
                </Text>
              </View>
              <Ionicons name="chevron-up-outline" size={18} color={COLORS.TEXT_LIGHT} />
            </View>
          </Pressable>
        )}
      />
      <MilestoneReviewSheet
        error={error}
        loading={selectedMilestoneQuery.isLoading}
        milestone={selectedMilestoneQuery.data}
        notes={notes}
        rating={rating}
        reviewLoading={inspectMutation.isPending}
        visible={sheetOpen}
        criteriaChecks={criteriaChecks}
        onApprove={() => submit("approved")}
        onClose={() => setSheetOpen(false)}
        onNotesChange={setNotes}
        onRatingChange={setRating}
        onRevision={() => submit("revision_required")}
        onToggleCriterion={toggleCriterion}
      />
    </SafeAreaView>
  );
}

function MilestoneReviewSheet({
  visible,
  loading,
  milestone,
  notes,
  rating,
  reviewLoading,
  error,
  onClose,
  onNotesChange,
  onRatingChange,
  onApprove,
  onRevision,
  criteriaChecks,
  onToggleCriterion,
}: {
  visible: boolean;
  loading: boolean;
  milestone?: SupervisorMilestoneDetail;
  notes: string;
  rating: string;
  reviewLoading: boolean;
  error: string;
  onClose: () => void;
  onNotesChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onApprove: () => void;
  onRevision: () => void;
  criteriaChecks: Record<string, "pass" | "fix">;
  onToggleCriterion: (criterion: string, value: "pass" | "fix") => void;
}) {
  const criteria = parseCriteria(milestone?.acceptanceCriteria || milestone?.description);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={{ alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontSize: 20, fontWeight: "900" }}>
              Review milestone
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <SelectedMilestoneDetails loading={loading} milestone={milestone} />
            <InspectionForm
              error={error}
              loading={reviewLoading}
              notes={notes}
              rating={rating}
              onApprove={onApprove}
              onNotesChange={onNotesChange}
              onRatingChange={onRatingChange}
              onRevision={onRevision}
              criteria={criteria}
              criteriaChecks={criteriaChecks}
              onToggleCriterion={onToggleCriterion}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SelectedMilestoneDetails({
  loading,
  milestone,
}: {
  loading: boolean;
  milestone?: SupervisorMilestoneDetail;
}) {
  if (loading) {
    return (
      <View style={styles.detailCard}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!milestone) {
    return (
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Select a milestone</Text>
        <Text style={styles.detailBody}>Choose a milestone below to review its full scope and BOQ package.</Text>
      </View>
    );
  }

  const boqItems = milestone.boqItems || [];
  const boqTotal = boqItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const latestInspection = milestone.inspections?.[0];
  const criteria = parseCriteria(milestone.acceptanceCriteria || milestone.description);
  const progressMedia = milestone.progressPhotos || [];
  const plans = milestone.project?.architecturalPlans || [];

  const openPlan = async () => {
    const planUrl = plans[0]?.cloudinaryUrl || plans[0]?.url;
    if (planUrl) {
      await Linking.openURL(planUrl);
    }
  };

  return (
    <View style={styles.detailCard}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailEyebrow}>MILESTONE REVIEW</Text>
          <Text style={styles.detailTitle}>{milestone.name}</Text>
          <Text style={styles.detailBody}>
            {milestone.project?.name || "Project"} • {String(milestone.status).replace(/_/g, " ")}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{String(milestone.status).replace(/_/g, " ").toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <InfoBox label="Budget" value={`${Number(milestone.budgetPercentage || 0)}%`} />
        <InfoBox label="Duration" value={`${milestone.durationDays || 0} days`} />
        <InfoBox label="BOQ total" value={`${Math.round(boqTotal).toLocaleString()} RWF`} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Acceptance criteria</Text>
        {criteria.length === 0 ? (
          <Text style={styles.detailBody}>No criteria provided.</Text>
        ) : (
          <View style={{ gap: 8, marginTop: 8 }}>
            {criteria.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.criteriaLine}>
                <View style={styles.criteriaIndex}>
                  <Text style={styles.criteriaIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.criteriaText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
          <Text style={styles.sectionTitle}>Original plans</Text>
          {plans.length > 0 ? (
            <Pressable onPress={openPlan} style={styles.linkButton}>
              <Ionicons name="document-text-outline" size={15} color={COLORS.PRIMARY} />
              <Text style={styles.linkButtonText}>View plans</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.detailBody}>
          {plans.length > 0
            ? `${plans.length} plan document${plans.length === 1 ? "" : "s"} attached to this project.`
            : "No original plans are attached to this project."}
        </Text>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Progress media</Text>
        {progressMedia.length === 0 ? (
          <Text style={styles.detailBody}>No progress media has been submitted for this milestone yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
            {progressMedia.map((media) => {
              const mediaUrl = media.cloudinaryUrl || media.url;
              return (
                <View key={media.id} style={styles.mediaCard}>
                  {mediaUrl && !media.isVideo ? (
                    <Image source={{ uri: mediaUrl }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.videoThumb}>
                      <Ionicons name="play-circle" size={34} color={COLORS.TEXT_WHITE} />
                    </View>
                  )}
                  <Text numberOfLines={2} style={styles.mediaCaption}>
                    {media.caption || (media.isVideo ? "Progress video" : "Progress photo")}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>BOQ package</Text>
        {boqItems.length === 0 ? (
          <Text style={styles.detailBody}>No BOQ items submitted with this milestone yet.</Text>
        ) : (
          boqItems.map((item) => (
            <View key={item.id} style={styles.boqRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.boqName}>{item.name}</Text>
                <Text style={styles.detailBody}>
                  {item.category} • {item.quantity} {item.unit} x {Number(item.unitPrice || 0).toLocaleString()} RWF
                </Text>
              </View>
              <Text style={styles.boqAmount}>{Number(item.totalPrice || 0).toLocaleString()} RWF</Text>
            </View>
          ))
        )}
      </View>

      {latestInspection?.notes ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Last supervisor comment</Text>
          <Text style={styles.detailBody}>{latestInspection.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

type InspectionFormProps = {
  notes: string;
  rating: string;
  loading: boolean;
  error: string;
  criteria: string[];
  criteriaChecks: Record<string, "pass" | "fix">;
  onNotesChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onApprove: () => void;
  onRevision: () => void;
  onToggleCriterion: (criterion: string, value: "pass" | "fix") => void;
};

function InspectionForm({
  notes,
  rating,
  loading,
  error,
  criteria,
  criteriaChecks,
  onNotesChange,
  onRatingChange,
  onApprove,
  onRevision,
  onToggleCriterion,
}: InspectionFormProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 14,
        padding: 16,
      }}
    >
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>
        Inspection decision
      </Text>
      {criteria.length > 0 ? (
        <View style={styles.checklistBox}>
          <Text style={styles.checklistTitle}>Criteria checklist</Text>
          {criteria.map((criterion, index) => (
            <View key={`${criterion}-${index}`} style={styles.checklistRow}>
              <Text style={styles.checklistText}>{criterion}</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <ChecklistToggle
                  active={criteriaChecks[criterion] === "pass"}
                  color={COLORS.SUCCESS}
                  label="Pass"
                  onPress={() => onToggleCriterion(criterion, "pass")}
                />
                <ChecklistToggle
                  active={criteriaChecks[criterion] === "fix"}
                  color={COLORS.WARNING}
                  label="Fix"
                  onPress={() => onToggleCriterion(criterion, "fix")}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
      <TextInput
        multiline
        onChangeText={onNotesChange}
        placeholder="Quality notes"
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{
          backgroundColor: COLORS.MUTED,
          borderRadius: 8,
          color: COLORS.TEXT_PRIMARY,
          marginTop: 12,
          minHeight: 88,
          padding: 12,
        }}
        value={notes}
      />
      <TextInput
        keyboardType="number-pad"
        onChangeText={onRatingChange}
        placeholder="Rating 1-5"
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{
          backgroundColor: COLORS.MUTED,
          borderRadius: 8,
          color: COLORS.TEXT_PRIMARY,
          marginTop: 10,
          padding: 12,
        }}
        value={rating}
      />
      {error ? (
        <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 10 }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <DecisionButton disabled={loading} label="Approve" color={COLORS.SUCCESS} onPress={onApprove} />
        <DecisionButton disabled={loading} label="Revision" color={COLORS.WARNING} onPress={onRevision} />
      </View>
    </View>
  );
}

function ChecklistToggle({
  active,
  color,
  label,
  onPress,
}: {
  active: boolean;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? color : COLORS.SURFACE,
        borderColor: active ? color : COLORS.BORDER_LIGHT,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DecisionButton({ label, color, disabled, onPress }: { label: string; color: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: color,
        borderRadius: 8,
        flex: 1,
        opacity: disabled ? 0.7 : 1,
        paddingVertical: 13,
      }}
    >
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  sheetScrim: {
    backgroundColor: "rgba(15,23,42,0.45)",
    bottom: 0,
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%" as const,
    padding: 18,
    paddingBottom: 0,
  },
  sheetHandle: {
    alignSelf: "center" as const,
    backgroundColor: COLORS.BORDER,
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 44,
  },
  closeButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 999,
    height: 36,
    justifyContent: "center" as const,
    width: 36,
  },
  detailCard: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  detailEyebrow: {
    color: COLORS.PRIMARY,
    fontSize: 10,
    fontWeight: "900" as const,
  },
  detailTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "900" as const,
    marginTop: 3,
  },
  detailBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: COLORS.PRIMARY,
    fontSize: 9,
    fontWeight: "900" as const,
  },
  infoBox: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flex: 1,
    padding: 10,
  },
  infoLabel: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 9,
    fontWeight: "900" as const,
  },
  infoValue: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  sectionBlock: {
    borderTopColor: COLORS.BORDER_LIGHT,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  criteriaLine: {
    alignItems: "flex-start" as const,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    flexDirection: "row" as const,
    gap: 8,
    padding: 10,
  },
  criteriaIndex: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 999,
    height: 22,
    justifyContent: "center" as const,
    width: 22,
  },
  criteriaIndexText: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  criteriaText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  linkButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 999,
    flexDirection: "row" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  mediaCard: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 10,
    overflow: "hidden" as const,
    width: 132,
  },
  mediaImage: {
    backgroundColor: COLORS.BORDER_LIGHT,
    height: 92,
    width: "100%" as const,
  },
  videoThumb: {
    alignItems: "center" as const,
    backgroundColor: COLORS.INK,
    height: 92,
    justifyContent: "center" as const,
    width: "100%" as const,
  },
  mediaCaption: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 15,
    padding: 8,
  },
  checklistBox: {
    backgroundColor: COLORS.MUTED,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  checklistTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: "900" as const,
  },
  checklistRow: {
    alignItems: "center" as const,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "space-between" as const,
    padding: 9,
  },
  checklistText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  boqRow: {
    alignItems: "flex-start" as const,
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    flexDirection: "row" as const,
    gap: 10,
    paddingVertical: 10,
  },
  boqName: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "900" as const,
  },
  boqAmount: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "900" as const,
  },
};
