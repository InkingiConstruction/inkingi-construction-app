import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { SupervisorTopBar } from "@/components/supervisor/supervisor-top-bar";
import { SupervisorMilestone } from "@/components/supervisor/supervisor-types";

export default function SupervisorInspections() {
  const params = useLocalSearchParams<{ projectId?: string; milestoneId?: string }>();
  const queryClient = useQueryClient();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(params.milestoneId || "");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("5");
  const [error, setError] = useState("");

  const milestonesQuery = useQuery({
    queryKey: ["supervisor-milestones", params.projectId],
    queryFn: async () => {
      const response = await api.get<SupervisorMilestone[]>(ENDPOINTS.MILESTONES.LIST, {
        params: params.projectId ? { projectId: params.projectId } : undefined,
      });
      return response.data;
    },
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
        },
      }),
    onSuccess: () => {
      setError("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["supervisor-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-inspections"] });
      router.push("/(supervisor)/projects");
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
            <InspectionForm
              notes={notes}
              rating={rating}
              loading={inspectMutation.isPending}
              error={error}
              onNotesChange={setNotes}
              onRatingChange={setRating}
              onApprove={() => submit("approved")}
              onRevision={() => submit("revision_required")}
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
            refreshing={milestonesQuery.isRefetching}
            onRefresh={milestonesQuery.refetch}
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedMilestoneId(item.id)}
            style={{
              backgroundColor: selectedMilestoneId === item.id ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
              borderColor: selectedMilestoneId === item.id ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
              borderRadius: 10,
              borderWidth: 1,
              padding: 15,
            }}
          >
            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
              <Ionicons
                name={selectedMilestoneId === item.id ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selectedMilestoneId === item.id ? COLORS.PRIMARY : COLORS.TEXT_LIGHT}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.name}</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  Status: {item.status}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

type InspectionFormProps = {
  notes: string;
  rating: string;
  loading: boolean;
  error: string;
  onNotesChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onApprove: () => void;
  onRevision: () => void;
};

function InspectionForm({
  notes,
  rating,
  loading,
  error,
  onNotesChange,
  onRatingChange,
  onApprove,
  onRevision,
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
