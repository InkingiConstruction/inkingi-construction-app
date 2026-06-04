import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { formatRWF } from "@/utils/projectFunds";
import { verifyPasscode } from "@/utils/SecurityUtils";

const { width } = Dimensions.get("window");

type ClientMilestoneView = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: string;
  budgetPercentage: number;
  budgetAmount: number;
  checklist: { id: string; task: string; completed: boolean }[];
  completionPhotos: string[];
  revisionNotes?: string | null;
};

const toDisputeCategory = (value: "Quality" | "Timeline" | "Cost" | "Other") =>
  value.toLowerCase();

const toMilestoneView = (milestone: any, project: any): ClientMilestoneView => {
  const budgetPercentage = Number(milestone.budgetPercentage || 0);
  const projectBudget = Number(project?.budget || project?.totalBudget || 0);
  const status = milestone.status === "paid" ? "completed" : milestone.status;
  const progressPhotos = Array.isArray(milestone.progressPhotos)
    ? milestone.progressPhotos
    : [];

  return {
    id: milestone.id,
    projectId: milestone.projectId,
    name: milestone.name,
    description: milestone.description || milestone.acceptanceCriteria || "No description provided.",
    status,
    budgetPercentage,
    budgetAmount: Math.round((projectBudget * budgetPercentage) / 100),
    checklist: [
      {
        id: `${milestone.id}-scope`,
        task: milestone.acceptanceCriteria || milestone.description || "Milestone scope submitted",
        completed: ["pending_supervisor", "awaiting_client_payment", "paid", "completed"].includes(milestone.status),
      },
      {
        id: `${milestone.id}-review`,
        task: "Supervisor review completed",
        completed: ["awaiting_client_payment", "paid", "completed"].includes(milestone.status),
      },
      {
        id: `${milestone.id}-payment`,
        task: "Client payment released",
        completed: ["paid", "completed"].includes(milestone.status),
      },
    ],
    completionPhotos: progressPhotos
      .map((photo: any) => photo.cloudinaryUrl)
      .filter(Boolean),
    revisionNotes: milestone.revisionNotes || milestone.clientNotes || null,
  };
};

export default function MilestonesScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [projectId, setProjectId] = useState(params.projectId || "");
  const [viewMode, setViewMode] = useState<"timeline" | "board">("timeline");

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletBudget, setWalletBudget] = useState<number>(0);

  // Fetch projects to map/select
  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<any[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });

  const projects = projectsQuery.data || [];
  const activeProject = projects.find(p => p.id === projectId) || projects[0];

  const milestonesQuery = useQuery({
    queryKey: ["client-milestones", projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (await api.get<any[]>(ENDPOINTS.MILESTONES.LIST, { params: { projectId } })).data,
  });

  const escrowQuery = useQuery({
    queryKey: ["client-escrow", projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (await api.get<any[]>(ENDPOINTS.ESCROW_ACCOUNTS.LIST, { params: { projectId } })).data,
  });

  const activeEscrow = escrowQuery.data?.[0];

  useEffect(() => {
    if (activeProject && !projectId) {
      setProjectId(activeProject.id);
    }
  }, [activeProject, projectId]);

  useEffect(() => {
    if (activeProject) {
      setWalletBudget(Number(activeProject.budget || activeProject.totalBudget || 0));
    }
    if (activeEscrow) {
      setWalletBalance(Number(activeEscrow.balance || 0));
    } else {
      setWalletBalance(0);
    }
  }, [activeEscrow, activeProject]);

  // Filter milestones for selected project
  const projectMilestones = (milestonesQuery.data || []).map((milestone) =>
    toMilestoneView(milestone, activeProject),
  );
  const refreshing = projectsQuery.isRefetching || milestonesQuery.isRefetching || escrowQuery.isRefetching;
  const refresh = () => {
    projectsQuery.refetch();
    milestonesQuery.refetch();
    escrowQuery.refetch();
  };

  // Modal & Flow control states
  const [selectedMilestone, setSelectedMilestone] = useState<ClientMilestoneView | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "passcode" | "revision" | "dispute">("view");
  
  // Passcode state
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [passcodeAttempts, setPasscodeAttempts] = useState(5);

  // Revision state
  const [revisionNotes, setRevisionNotes] = useState("");

  // Dispute state
  const [disputeCategory, setDisputeCategory] = useState<"Quality" | "Timeline" | "Cost" | "Other">("Quality");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const releasePaymentMutation = useMutation({
    mutationFn: async (milestone: ClientMilestoneView) => {
      if (!activeEscrow?.id) {
        throw new Error("No escrow account found for this project. Please fund the project first.");
      }

      return api.post(ENDPOINTS.TRANSACTIONS.CREATE, {
        escrowAccountId: activeEscrow.id,
        milestoneId: milestone.id,
        type: "release",
        method: "bank_transfer",
        amount: milestone.budgetAmount,
        status: "completed",
        reference: `CLIENT-RELEASE-${Date.now()}`,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-milestones"] }),
        queryClient.invalidateQueries({ queryKey: ["client-escrow"] }),
        queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
      ]);
    },
  });

  const revisionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMilestone) throw new Error("Milestone is required");
      return api.put(ENDPOINTS.MILESTONES.UPDATE(selectedMilestone.id), {
        status: "revision_required",
        revisionNotes,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-milestones"] });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMilestone) throw new Error("Milestone is required");
      return api.post<{ dispute: { id: string } }>(ENDPOINTS.DISPUTES.CREATE, {
        projectId,
        milestoneId: selectedMilestone.id,
        category: toDisputeCategory(disputeCategory),
        description: disputeDesc.trim(),
        amountInDispute: selectedMilestone.budgetAmount,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-disputes"] }),
        queryClient.invalidateQueries({ queryKey: ["client-milestones"] }),
      ]);
    },
  });

  const handleOpenMilestone = (ms: ClientMilestoneView) => {
    setSelectedMilestone(ms);
    setModalMode("view");
    setPasscode("");
    setPasscodeError("");
    setRevisionNotes("");
    setDisputeDesc("");
    setDisputeEvidence([]);
  };

  // 1. Release Payment (with passcode check)
  const handleReleasePaymentPress = () => {
    setModalMode("passcode");
  };

  const handleVerifyPasscodeSubmit = async () => {
    if (!selectedMilestone) return;
    setPasscodeError("");
    
    try {
      const res = await verifyPasscode(passcode);
      if (res.success) {
        await releasePaymentMutation.mutateAsync(selectedMilestone);
        
        Alert.alert("Success", "Payment released from escrow successfully! Engineer has been notified.");
        setSelectedMilestone(null);
      } else {
        setPasscode("");
        setPasscodeAttempts(res.remainingAttempts);
        setPasscodeError(res.isLocked 
          ? `Security lockout. Try again in ${res.lockoutRemaining}s` 
          : `Incorrect PIN. ${res.remainingAttempts} attempts remaining.`
        );
      }
    } catch (e) {
      setPasscodeError("Error validating security PIN.");
    }
  };

  // 2. Request Revision
  const handleRevisionSubmit = async () => {
    if (!selectedMilestone) return;
    if (!revisionNotes.trim()) {
      Alert.alert("Required", "Please describe what details need revision.");
      return;
    }

    try {
      await revisionMutation.mutateAsync();
      Alert.alert(
        "Revision Requested",
        `Your notes have been sent to the engineer.\n\nSubject: Changes required: ${selectedMilestone.name}\nWe'll notify you once they resubmit.`
      );
      setSelectedMilestone(null);
    } catch (error) {
      Alert.alert("Revision Failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  // 3. Initiate Dispute
  const handleMockUpload = () => {
    setUploadingEvidence(true);
    setTimeout(() => {
      setDisputeEvidence([
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60"
      ]);
      setUploadingEvidence(false);
      Alert.alert("Success", "Evidence photos uploaded to Cloudinary.");
    }, 1200);
  };

  const handleDisputeSubmit = async () => {
    if (!selectedMilestone) return;
    if (disputeDesc.trim().length < 50) {
      Alert.alert("Minimum Length", "Please write at least 50 characters to explain the issue clearly for the mediator.");
      return;
    }

    try {
      const response = await disputeMutation.mutateAsync();
      const disputeId = response.data.dispute.id;

      Alert.alert(
        "Dispute Submitted",
        `Dispute ID: ${disputeId}\nWe have notified the project team and IER review workflow.`,
        [
          {
            text: "Track Dispute",
            onPress: () => {
              setSelectedMilestone(null);
              router.push({
                pathname: "/(client)/disputes",
                params: { disputeId }
              } as never);
            }
          },
          {
            text: "Close",
            onPress: () => setSelectedMilestone(null)
          }
        ]
      );
    } catch (error) {
      Alert.alert("Dispute Failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  // Trello Columns mapping
  const boardColumns = {
    pending: projectMilestones.filter(m => m.status === "pending"),
    active: projectMilestones.filter(m => m.status === "active"),
    review: projectMilestones.filter(m => ["awaiting_client_payment", "revision_required"].includes(m.status)),
    completed: projectMilestones.filter(m => m.status === "completed")
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.PRIMARY} />}
      >
        
        {/* Header */}
        <View style={{ paddingHorizontal: 20 }}>
          <ClientTopBar
            title="Milestone Workspace"
            subtitle="Track progress, approve budgets, request revisions, or resolve disputes."
            back={true}
          />
        </View>

        {/* Project Selector */}
        {projects.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 20 }}
          >
            {projects.map(p => (
              <Pressable
                key={p.id}
                onPress={() => setProjectId(p.id)}
                style={{
                  backgroundColor: projectId === p.id ? COLORS.PRIMARY : COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ 
                  color: projectId === p.id ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
                  fontWeight: "bold", 
                  fontSize: 13 
                }}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Financial Escrow Card */}
        {activeProject && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: COLORS.INK,
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "800" }}>
                  ESCROW WALLET BALANCE
                </Text>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 20, fontWeight: "900", marginTop: 4 }}>
                  {formatRWF(walletBalance)}
                </Text>
                <Text style={{ color: "#CBD5E1", fontSize: 12, marginTop: 4 }}>
                  Total Project Budget: {formatRWF(walletBudget)}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(client)/payments")}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold", fontSize: 12 }}>Top Up</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* View Toggle (Timeline / Trello Board) */}
        <View style={{ 
          flexDirection: "row", 
          marginHorizontal: 20, 
          backgroundColor: COLORS.SURFACE, 
          borderRadius: 12, 
          padding: 4, 
          borderColor: COLORS.BORDER_LIGHT,
          borderWidth: 1,
          marginBottom: 20 
        }}>
          <Pressable
            onPress={() => setViewMode("timeline")}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              backgroundColor: viewMode === "timeline" ? COLORS.PRIMARY : "transparent",
              paddingVertical: 10,
              borderRadius: 8
            }}
          >
            <Ionicons name="git-commit-outline" size={18} color={viewMode === "timeline" ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY} />
            <Text style={{ 
              color: viewMode === "timeline" ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
              fontWeight: "900",
              fontSize: 13
            }}>
              Timeline / Gantt
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setViewMode("board")}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              backgroundColor: viewMode === "board" ? COLORS.PRIMARY : "transparent",
              paddingVertical: 10,
              borderRadius: 8
            }}
          >
            <Ionicons name="grid-outline" size={18} color={viewMode === "board" ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY} />
            <Text style={{ 
              color: viewMode === "board" ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
              fontWeight: "900",
              fontSize: 13
            }}>
              Trello Board
            </Text>
          </Pressable>
        </View>

        {projectMilestones.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="flag-outline" size={48} color={COLORS.TEXT_LIGHT} />
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 12, textAlign: "center", lineHeight: 20 }}>
              No milestones found. Milestones will appear once your wallet is funded and project is in planning/execution.
            </Text>
          </View>
        ) : viewMode === "timeline" ? (
          
          // Gantt / Timeline view
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {projectMilestones.map((ms, index) => {
              const completedCount = ms.checklist.filter(c => c.completed).length;
              const progressPct = ms.checklist.length > 0 ? (completedCount / ms.checklist.length) * 100 : 0;
              
              return (
                <Pressable
                  key={ms.id}
                  onPress={() => handleOpenMilestone(ms)}
                  style={{
                    backgroundColor: COLORS.SURFACE,
                    borderRadius: 12,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderWidth: 1,
                    padding: 16,
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Status strip */}
                  <View style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    backgroundColor: 
                      ms.status === "completed" ? COLORS.SUCCESS :
                      ms.status === "awaiting_client_payment" ? COLORS.PRIMARY :
                      ms.status === "revision_required" ? COLORS.WARNING :
                      ms.status === "active" ? "#3B82F6" : COLORS.TEXT_LIGHT
                  }} />

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: 6 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{ms.name}</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                        {ms.description}
                      </Text>
                    </View>
                    <StatusBadge value={ms.status} />
                  </View>

                  {/* Gantt-style Horizontal Progress Bar */}
                  <View style={{ marginTop: 14, paddingLeft: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>
                        TASKS: {completedCount}/{ms.checklist.length} ({Math.round(progressPct)}%)
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.PRIMARY, fontWeight: "900" }}>
                        {formatRWF(ms.budgetAmount)} ({ms.budgetPercentage}%)
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: COLORS.MUTED, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ 
                        height: "100%", 
                        width: `${progressPct}%`, 
                        backgroundColor: 
                          ms.status === "completed" ? COLORS.SUCCESS : 
                          ms.status === "revision_required" ? COLORS.WARNING : COLORS.PRIMARY, 
                        borderRadius: 4 
                      }} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          
          // Trello Board view
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14, height: 420 }}
          >
            {/* COLUMN: Awaiting Action */}
            <BoardColumn 
              title="Awaiting Review" 
              count={boardColumns.review.length}
              color={COLORS.PRIMARY}
            >
              {boardColumns.review.map(ms => (
                <BoardCard key={ms.id} ms={ms} onPress={() => handleOpenMilestone(ms)} />
              ))}
            </BoardColumn>

            {/* COLUMN: Active */}
            <BoardColumn 
              title="In Progress" 
              count={boardColumns.active.length} 
              color="#3B82F6"
            >
              {boardColumns.active.map(ms => (
                <BoardCard key={ms.id} ms={ms} onPress={() => handleOpenMilestone(ms)} />
              ))}
            </BoardColumn>

            {/* COLUMN: Pending */}
            <BoardColumn 
              title="Backlog / Pending" 
              count={boardColumns.pending.length} 
              color={COLORS.TEXT_LIGHT}
            >
              {boardColumns.pending.map(ms => (
                <BoardCard key={ms.id} ms={ms} onPress={() => handleOpenMilestone(ms)} />
              ))}
            </BoardColumn>

            {/* COLUMN: Completed */}
            <BoardColumn 
              title="Completed" 
              count={boardColumns.completed.length} 
              color={COLORS.SUCCESS}
            >
              {boardColumns.completed.map(ms => (
                <BoardCard key={ms.id} ms={ms} onPress={() => handleOpenMilestone(ms)} />
              ))}
            </BoardColumn>
          </ScrollView>
        )}

      </ScrollView>

      {/* Milestone interactive review modal */}
      {selectedMilestone && (
        <Modal
          visible={!!selectedMilestone}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedMilestone(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSubtitle}>MILESTONE WORKSPACE</Text>
                  <Text style={styles.modalTitle}>{selectedMilestone.name}</Text>
                </View>
                <Pressable onPress={() => setSelectedMilestone(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                
                {modalMode === "view" && (
                  <View style={{ gap: 18 }}>
                    
                    {/* Status card */}
                    <View style={{ 
                      backgroundColor: COLORS.MUTED, 
                      padding: 12, 
                      borderRadius: 10,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <View>
                        <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>CURRENT STATUS</Text>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: COLORS.TEXT_PRIMARY, marginTop: 2 }}>
                          {selectedMilestone.status.replace(/_/g, " ").toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>BUDGET VALUE</Text>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: COLORS.PRIMARY, marginTop: 2 }}>
                          {formatRWF(selectedMilestone.budgetAmount)}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <View>
                      <Text style={styles.sectionLabel}>Overview</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19 }}>
                        {selectedMilestone.description}
                      </Text>
                    </View>

                    {/* Deliverables Checklist */}
                    <View>
                      <Text style={styles.sectionLabel}>Deliverables Checklist</Text>
                      <View style={{ gap: 8, marginTop: 6 }}>
                        {selectedMilestone.checklist.map(item => (
                          <View 
                            key={item.id} 
                            style={{ 
                              flexDirection: "row", 
                              alignItems: "center", 
                              gap: 10,
                              backgroundColor: COLORS.SURFACE,
                              padding: 10,
                              borderRadius: 8,
                              borderColor: COLORS.BORDER_LIGHT,
                              borderWidth: 1
                            }}
                          >
                            <Ionicons 
                              name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
                              size={20} 
                              color={item.completed ? COLORS.SUCCESS : COLORS.TEXT_LIGHT} 
                            />
                            <Text style={{ 
                              flex: 1, 
                              color: item.completed ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                              textDecorationLine: item.completed ? "line-through" : "none",
                              fontSize: 13
                            }}>
                              {item.task}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Completion Photos */}
                    {selectedMilestone.completionPhotos.length > 0 && (
                      <View>
                        <Text style={styles.sectionLabel}>Completion Evidence Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 8 }}>
                          {selectedMilestone.completionPhotos.map((url, idx) => (
                            <Image 
                              key={idx} 
                              source={{ uri: url }} 
                              style={{ width: 140, height: 100, borderRadius: 8, backgroundColor: COLORS.MUTED }} 
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Revision request logs if any */}
                    {selectedMilestone.revisionNotes && (
                      <View style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B", borderWidth: 1, borderRadius: 8, padding: 12 }}>
                        <Text style={{ color: "#D97706", fontWeight: "bold", fontSize: 12 }}>Previous Revision Notes</Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                          {selectedMilestone.revisionNotes}
                        </Text>
                      </View>
                    )}

                    {/* Actions Gated by status */}
                    {selectedMilestone.status === "awaiting_client_payment" && (
                      <View style={{ gap: 10, marginTop: 12 }}>
                        
                        <Pressable 
                          onPress={handleReleasePaymentPress}
                          style={[styles.btn, { backgroundColor: COLORS.PRIMARY }]}
                        >
                          <Ionicons name="card-outline" size={20} color={COLORS.TEXT_WHITE} />
                          <Text style={styles.btnText}>Approve & Release Payment</Text>
                        </Pressable>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <Pressable 
                            onPress={() => setModalMode("revision")}
                            style={[styles.btn, { flex: 1, backgroundColor: COLORS.WARNING }]}
                          >
                            <Ionicons name="refresh-outline" size={18} color={COLORS.TEXT_WHITE} />
                            <Text style={styles.btnText}>Request Revision</Text>
                          </Pressable>

                          <Pressable 
                            onPress={() => setModalMode("dispute")}
                            style={[styles.btn, { flex: 1, backgroundColor: COLORS.ERROR }]}
                          >
                            <Ionicons name="alert-circle-outline" size={18} color={COLORS.TEXT_WHITE} />
                            <Text style={styles.btnText}>Initiate Dispute</Text>
                          </Pressable>
                        </View>
                        
                      </View>
                    )}

                    {selectedMilestone.status === "completed" && (
                      <View style={{ alignItems: "center", paddingVertical: 10 }}>
                        <Ionicons name="checkmark-circle" size={40} color={COLORS.SUCCESS} />
                        <Text style={{ color: COLORS.SUCCESS, fontWeight: "900", marginTop: 6 }}>
                          PAID & RELEASED FROM ESCROW
                        </Text>
                      </View>
                    )}

                    {selectedMilestone.status === "revision_required" && (
                      <View style={{ 
                        backgroundColor: COLORS.MUTED, 
                        borderColor: COLORS.BORDER_LIGHT, 
                        borderWidth: 1, 
                        padding: 12, 
                        borderRadius: 10, 
                        alignItems: "center" 
                      }}>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "bold", textAlign: "center" }}>
                          Waiting for Engineer Resubmission
                        </Text>
                        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, marginTop: 4, textAlign: "center" }}>
                          The engineer has been notified to address your revision requirements.
                        </Text>
                      </View>
                    )}

                  </View>
                )}

                {/* MODAL MODE: Passcode Lock */}
                {modalMode === "passcode" && (
                  <View style={{ gap: 16, alignItems: "center", paddingVertical: 20 }}>
                    <Ionicons name="lock-closed-outline" size={48} color={COLORS.PRIMARY} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "bold" }}>
                        Enter Transaction PIN
                      </Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                        Verify your security passcode to approve release of {formatRWF(selectedMilestone.budgetAmount)} escrow funds.
                      </Text>
                    </View>

                    <TextInput
                      style={{
                        backgroundColor: COLORS.MUTED,
                        borderColor: passcodeError ? COLORS.ERROR : COLORS.BORDER,
                        borderWidth: 1,
                        borderRadius: 12,
                        width: 180,
                        textAlign: "center",
                        fontSize: 24,
                        letterSpacing: 8,
                        paddingVertical: 12,
                        color: COLORS.TEXT_PRIMARY
                      }}
                      placeholder="••••"
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      secureTextEntry
                      keyboardType="numeric"
                      maxLength={4}
                      value={passcode}
                      onChangeText={(val) => {
                        setPasscode(val);
                        setPasscodeError("");
                      }}
                    />

                    {passcodeError ? (
                      <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "bold" }}>
                        {passcodeError}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: "row", gap: 10, width: "100%", marginTop: 10 }}>
                      <Pressable 
                        onPress={() => { setModalMode("view"); setPasscode(""); }} 
                        style={[styles.btn, { flex: 1, backgroundColor: COLORS.MUTED }]}
                      >
                        <Text style={[styles.btnText, { color: COLORS.TEXT_PRIMARY }]}>Cancel</Text>
                      </Pressable>
                      <Pressable 
                        onPress={handleVerifyPasscodeSubmit} 
                        disabled={passcode.length < 4}
                        style={[styles.btn, { flex: 2, backgroundColor: COLORS.PRIMARY }, passcode.length < 4 && { opacity: 0.5 }]}
                      >
                        <Text style={styles.btnText}>Authorize Release</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* MODAL MODE: Revision Form */}
                {modalMode === "revision" && (
                  <View style={{ gap: 14 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "bold" }}>
                      Request Revision
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                      State clearly what needs to be fixed. The engineer will receive these details along with an email and push notification.
                    </Text>
                    
                    <TextInput
                      style={{
                        backgroundColor: COLORS.MUTED,
                        borderColor: COLORS.BORDER_LIGHT,
                        borderWidth: 1,
                        borderRadius: 10,
                        height: 120,
                        padding: 12,
                        textAlignVertical: "top",
                        color: COLORS.TEXT_PRIMARY
                      }}
                      placeholder="e.g. Column masonry columns show cracking on side B. Plastering finish requires curing."
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      multiline
                      value={revisionNotes}
                      onChangeText={setRevisionNotes}
                    />

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <Pressable 
                        onPress={() => setModalMode("view")} 
                        style={[styles.btn, { flex: 1, backgroundColor: COLORS.MUTED }]}
                      >
                        <Text style={[styles.btnText, { color: COLORS.TEXT_PRIMARY }]}>Cancel</Text>
                      </Pressable>
                      <Pressable 
                        onPress={handleRevisionSubmit} 
                        style={[styles.btn, { flex: 2, backgroundColor: COLORS.WARNING }]}
                      >
                        <Text style={styles.btnText}>Submit Revision Request</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* MODAL MODE: Dispute Form */}
                {modalMode === "dispute" && (
                  <View style={{ gap: 14 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "bold" }}>
                      Initiate Dispute Resolution
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                      Escrow funds ({formatRWF(selectedMilestone.budgetAmount)}) will be frozen in a locked account. The IER arbitrations team will mediate.
                    </Text>

                    {/* Category Dropdown (Simulated) */}
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>Dispute Category</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {(["Quality", "Timeline", "Cost", "Other"] as const).map(cat => (
                        <Pressable
                          key={cat}
                          onPress={() => setDisputeCategory(cat)}
                          style={{
                            backgroundColor: disputeCategory === cat ? COLORS.PRIMARY : COLORS.MUTED,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderWidth: 1,
                            borderColor: disputeCategory === cat ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                          }}
                        >
                          <Text style={{ 
                            color: disputeCategory === cat ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
                            fontWeight: "bold", 
                            fontSize: 12 
                          }}>
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>
                      Detailed Reason (Min. 50 characters)
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: COLORS.MUTED,
                        borderColor: COLORS.BORDER_LIGHT,
                        borderWidth: 1,
                        borderRadius: 10,
                        height: 100,
                        padding: 12,
                        textAlignVertical: "top",
                        color: COLORS.TEXT_PRIMARY
                      }}
                      placeholder="State the technical specifications that were breached or details of construction failure..."
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      multiline
                      value={disputeDesc}
                      onChangeText={setDisputeDesc}
                    />
                    <Text style={{ 
                      fontSize: 11, 
                      color: disputeDesc.length >= 50 ? COLORS.SUCCESS : COLORS.TEXT_LIGHT,
                      alignSelf: "flex-end" 
                    }}>
                      {disputeDesc.length}/50 characters
                    </Text>

                    {/* Evidence Upload */}
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>Evidence Photos/Files</Text>
                    <Pressable 
                      onPress={handleMockUpload}
                      disabled={uploadingEvidence}
                      style={{
                        borderColor: COLORS.BORDER_LIGHT,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderRadius: 10,
                        padding: 16,
                        alignItems: "center",
                        backgroundColor: COLORS.SURFACE
                      }}
                    >
                      {uploadingEvidence ? (
                        <ActivityIndicator color={COLORS.PRIMARY} />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={24} color={COLORS.PRIMARY} />
                          <Text style={{ fontSize: 13, color: COLORS.PRIMARY, fontWeight: "bold", marginTop: 4 }}>
                            {disputeEvidence.length > 0 ? "Evidence Uploaded" : "Upload Documents/Photos"}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, marginTop: 2 }}>
                            Attach PDF reports, inspection photos, or bills of quantities.
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <Pressable 
                        onPress={() => setModalMode("view")} 
                        style={[styles.btn, { flex: 1, backgroundColor: COLORS.MUTED }]}
                      >
                        <Text style={[styles.btnText, { color: COLORS.TEXT_PRIMARY }]}>Cancel</Text>
                      </Pressable>
                      <Pressable 
                        onPress={handleDisputeSubmit} 
                        disabled={disputeDesc.length < 50}
                        style={[
                          styles.btn, 
                          { flex: 2, backgroundColor: COLORS.ERROR },
                          disputeDesc.length < 50 && { opacity: 0.5 }
                        ]}
                      >
                        <Text style={styles.btnText}>Submit Dispute</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Sub-components
function StatusBadge({ value }: { value: ClientMilestoneView["status"] }) {
  const label = value.replace(/_/g, " ");
  let color = COLORS.TEXT_SECONDARY;
  let bg = COLORS.MUTED;

  if (value === "completed") {
    color = COLORS.SUCCESS;
    bg = "#DCFCE7";
  } else if (value === "awaiting_client_payment") {
    color = COLORS.PRIMARY;
    bg = COLORS.PRIMARY_LIGHT;
  } else if (value === "revision_required") {
    color = "#D97706";
    bg = "#FEF3C7";
  } else if (value === "active") {
    color = "#2563EB";
    bg = "#DBEAFE";
  }

  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 10, fontWeight: "900" }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function BoardColumn({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <View style={{
      width: width * 0.75,
      backgroundColor: COLORS.SURFACE,
      borderColor: COLORS.BORDER_LIGHT,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      gap: 12
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomColor: COLORS.BORDER_LIGHT, borderBottomWidth: 1, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 14 }}>{title}</Text>
        </View>
        <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>{count}</Text>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {children}
        {count === 0 && (
          <View style={{ padding: 24, alignItems: "center", borderStyle: "dashed", borderColor: COLORS.BORDER_LIGHT, borderWidth: 1, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT }}>Empty Column</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BoardCard({ ms, onPress }: { ms: ClientMilestoneView; onPress: () => void }) {
  const completedCount = ms.checklist.filter(c => c.completed).length;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: COLORS.MUTED,
        borderRadius: 8,
        padding: 12,
        borderColor: COLORS.BORDER_LIGHT,
        borderWidth: 1
      }}
    >
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }} numberOfLines={1}>
        {ms.name}
      </Text>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 4 }} numberOfLines={2}>
        {ms.description}
      </Text>
      
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: COLORS.TEXT_LIGHT }}>
          Tasks: {completedCount}/{ms.checklist.length}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.PRIMARY, fontWeight: "bold" }}>
          {formatRWF(ms.budgetAmount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2
  },
  modalSubtitle: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    letterSpacing: 1
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10
  },
  btnText: {
    color: COLORS.TEXT_WHITE,
    fontWeight: "bold",
    fontSize: 14
  }
});
