import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { ClientAssignment, ClientUser } from "@/components/client/client-types";

const { width } = Dimensions.get("window");

type EngineerProfile = ClientUser & {
  specialty: string;
  avatar?: string | null;
  rating: number;
  completedJobsCount: number;
  bio: string;
  phone?: string | null;
  certifications: string[];
  gallery: string[];
  recentJobs: {
    id: string;
    title: string;
    clientName: string;
    rating: number;
    feedback: string;
    completionDate: string;
  }[];
};

const toEngineerProfile = (user: ClientUser): EngineerProfile => {
  const roleSpecific = (user as any).roleSpecific || {};
  const specialty =
    roleSpecific.specialization ||
    roleSpecific.specialty ||
    roleSpecific.engineerType ||
    "Construction Engineer";

  return {
    ...user,
    specialty,
    avatar: user.image,
    rating: Number(roleSpecific.rating || 0),
    completedJobsCount: Number(roleSpecific.completedJobsCount || 0),
    bio:
      roleSpecific.bio ||
      `${user.name || "Engineer"} is a verified engineer registered on Inkingi.`,
    phone: (user as any).phoneNumber || null,
    certifications: Array.isArray(roleSpecific.certifications)
      ? roleSpecific.certifications
      : roleSpecific.licenseNumber
        ? [`License ${roleSpecific.licenseNumber}`]
        : ["Registration profile submitted"],
    gallery: Array.isArray(roleSpecific.gallery) ? roleSpecific.gallery : [],
    recentJobs: Array.isArray(roleSpecific.recentJobs) ? roleSpecific.recentJobs : [],
  };
};

export default function AssignEngineerScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [projectId, setProjectId] = useState(params.projectId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  
  // Selected engineer for profile view
  const [viewingEngineer, setViewingEngineer] = useState<EngineerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "docs" | "ratings" | "jobs">("overview");

  // Additional screen states
  const [screenTab, setScreenTab] = useState<"search" | "invitations">("search");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docViewerMode, setDocViewerMode] = useState<"ask" | "preview" | null>(null);

  // Fetch projects
  const projectsQuery = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => (await api.get<any[]>(ENDPOINTS.PROJECTS.LIST)).data,
  });

  const projects = projectsQuery.data || [];
  const activeProject = projects.find(p => p.id === projectId) || projects[0];

  const engineersQuery = useQuery({
    queryKey: ["client-engineers"],
    queryFn: async () => (await api.get<ClientUser[]>(ENDPOINTS.USERS.ENGINEERS)).data.map(toEngineerProfile),
  });

  const invitationsQuery = useQuery({
    queryKey: ["client-project-members", projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (await api.get<ClientAssignment[]>(ENDPOINTS.PROJECT_MEMBERS.LIST, {
        params: { projectId },
      })).data.filter((assignment) => assignment.role === "engineer"),
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (engineer: EngineerProfile) =>
      api.post(ENDPOINTS.PROJECT_MEMBERS.CREATE, {
        projectId,
        userId: engineer.id,
        role: "engineer",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-project-members"] }),
        queryClient.invalidateQueries({ queryKey: ["client-projects"] }),
      ]);
    },
  });

  const removeInviteMutation = useMutation({
    mutationFn: async (assignmentId: string) =>
      api.delete(ENDPOINTS.PROJECT_MEMBERS.DETAIL(assignmentId)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-project-members"] }),
        queryClient.invalidateQueries({ queryKey: ["client-projects"] }),
      ]);
    },
  });

  useEffect(() => {
    if (activeProject && !projectId) {
      setProjectId(activeProject.id);
    }
  }, [activeProject]);

  const engineers = engineersQuery.data || [];
  const invitations = invitationsQuery.data || [];
  const refreshing =
    projectsQuery.isRefetching ||
    engineersQuery.isRefetching ||
    invitationsQuery.isRefetching;
  const refresh = () => {
    projectsQuery.refetch();
    engineersQuery.refetch();
    invitationsQuery.refetch();
  };

  // Filter engineers by search query
  const filteredEngineers = engineers.filter(e => 
    (e.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter invitations for current project
  const projectInvitations = invitations.filter(inv => inv.projectId === projectId);

  const handleSendInvite = async (engineerIdOrEmail: string, name?: string) => {
    if (!projectId) {
      Alert.alert("Project Required", "Please select a project first.");
      return;
    }

    const currentProject = projects.find(p => p.id === projectId);
    const projectName = currentProject ? currentProject.name : "Project";
    const engineer =
      engineers.find((item) => item.id === engineerIdOrEmail) ||
      engineers.find((item) => item.email?.toLowerCase() === engineerIdOrEmail.toLowerCase());

    if (!engineer) {
      Alert.alert("Engineer Not Found", "That engineer is not registered or is not available yet.");
      return;
    }

    try {
      await sendInviteMutation.mutateAsync(engineer);
    } catch (error) {
      Alert.alert("Invitation Failed", error instanceof Error ? error.message : "Please try again.");
      return;
    }

    // Close engineer detail modal if open
    setViewingEngineer(null);
    setEmailInput("");
    setSearchQuery("");
    
    // Switch to invitations tab instantly
    setScreenTab("invitations");

    Alert.alert(
      "Invitation Sent",
      `Invitation sent to ${name || engineer.name || engineer.email} for ${projectName}.\n\nStatus: Pending acceptance`
    );
  };

  const handleViewDocument = (docName: string) => {
    setSelectedDoc(docName);
    setDocViewerMode("ask");
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
            title="Invite Engineer"
            subtitle="Search verified engineers or send direct email invitations."
            back={true}
          />
        </View>

        {/* Project Selector Warning */}
        {projects.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={styles.label}>Select Project Workspace</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 6 }}>
              {projects.map(p => {
                const hasEng = !!p.engineerId;
                const isSelected = projectId === p.id;
                
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setProjectId(p.id)}
                    style={{
                      backgroundColor: isSelected ? COLORS.PRIMARY : COLORS.SURFACE,
                      borderColor: isSelected ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      gap: 4
                    }}
                  >
                    <Text style={{ 
                      color: isSelected ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
                      fontWeight: "bold", 
                      fontSize: 13 
                    }}>
                      {p.name}
                    </Text>
                    {!hasEng && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="warning-outline" size={12} color={isSelected ? COLORS.TEXT_WHITE : COLORS.WARNING} />
                        <Text style={{ 
                          color: isSelected ? COLORS.TEXT_WHITE : COLORS.WARNING, 
                          fontSize: 10, 
                          fontWeight: "bold" 
                        }}>
                          No Engineer Assigned
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Segmented Control Tabs */}
        <View style={{ flexDirection: "row", marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.MUTED, borderRadius: 10, padding: 4 }}>
          <Pressable
            onPress={() => setScreenTab("search")}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor: screenTab === "search" ? COLORS.SURFACE : "transparent",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: screenTab === "search" ? 0.1 : 0,
              elevation: screenTab === "search" ? 1 : 0
            }}
          >
            <Text style={{ color: screenTab === "search" ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY, fontWeight: "bold", fontSize: 13 }}>
              Find Engineers
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setScreenTab("invitations")}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor: screenTab === "invitations" ? COLORS.SURFACE : "transparent",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: screenTab === "invitations" ? 0.1 : 0,
              elevation: screenTab === "invitations" ? 1 : 0
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: screenTab === "invitations" ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY, fontWeight: "bold", fontSize: 13 }}>
                Sent Invitations
              </Text>
              {projectInvitations.length > 0 && (
                <View style={{ backgroundColor: COLORS.PRIMARY, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 10, fontWeight: "bold" }}>
                    {projectInvitations.length}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Tab 1: Find Engineers */}
        {screenTab === "search" && (
          <View>
            {/* Verified Engineers Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={styles.label}>Search Verified Engineers</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={COLORS.TEXT_LIGHT} />
                <TextInput
                  style={{ flex: 1, color: COLORS.TEXT_PRIMARY, fontSize: 13, paddingVertical: 8 }}
                  placeholder="Search by name, specialty, certifications..."
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Engineers list */}
              <View style={{ gap: 12, marginTop: 12 }}>
                {filteredEngineers.map(eng => (
                  <Pressable
                    key={eng.id}
                    onPress={() => {
                      setViewingEngineer(eng);
                      setActiveTab("overview");
                    }}
                    style={{
                      backgroundColor: COLORS.SURFACE,
                      borderColor: COLORS.BORDER_LIGHT,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    {eng.avatar && (
                      <Image 
                        source={{ uri: eng.avatar }} 
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.MUTED }} 
                      />
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", fontSize: 14 }}>
                          {eng.name}
                        </Text>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.PRIMARY} />
                      </View>
                      
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                        {eng.specialty}
                      </Text>
                      
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={{ fontSize: 11, color: COLORS.TEXT_SECONDARY, fontWeight: "bold" }}>
                          {eng.rating} • {eng.completedJobsCount} jobs completed
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: COLORS.PRIMARY_LIGHT,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8
                    }}>
                      <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "bold", fontSize: 11 }}>
                        Profile
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Direct Email Invite Card */}
            <View style={{ marginHorizontal: 20, backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderWidth: 1, borderRadius: 14, padding: 16 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", fontSize: 14, marginBottom: 4 }}>
                Invite Directly by Email
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginBottom: 12 }}>
                Input the engineer&apos;s registered email address to issue a project invitation directly.
              </Text>
              
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.MUTED,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    color: COLORS.TEXT_PRIMARY,
                    fontSize: 13
                  }}
                  placeholder="engineer@email.com"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailInput}
                  onChangeText={setEmailInput}
                />
                <Pressable
                  onPress={() => {
                    if (!emailInput.trim() || !emailInput.includes("@")) {
                      Alert.alert("Invalid Email", "Please enter a valid email address.");
                      return;
                    }
                    handleSendInvite(emailInput.trim());
                  }}
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold", fontSize: 13 }}>Send Invite</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Outgoing Invitations */}
        {screenTab === "invitations" && (
          <View style={{ marginHorizontal: 20, backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderWidth: 1, borderRadius: 14, padding: 16 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", fontSize: 14, marginBottom: 12 }}>
              Outgoing Invitations for {activeProject?.name || "Project"}
            </Text>
            {projectInvitations.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 35, gap: 10 }}>
                <Ionicons name="mail-open-outline" size={48} color={COLORS.TEXT_LIGHT} />
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, fontWeight: "bold" }}>
                  No active invitations for this project
                </Text>
                <Pressable 
                  onPress={() => setScreenTab("search")}
                  style={{ marginTop: 8, backgroundColor: COLORS.PRIMARY_LIGHT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontWeight: "bold", fontSize: 12 }}>
                    Find Engineers
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {projectInvitations.map(inv => (
                  <View 
                    key={inv.id}
                    style={{
                      backgroundColor: COLORS.MUTED,
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 14 }}>
                        {inv.user?.name || inv.user?.email || "Engineer"}
                      </Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                        Sent on {new Date(inv.invitedAt || Date.now()).toLocaleDateString()}
                      </Text>
                      <View style={{ 
                        alignSelf: "flex-start",
                        backgroundColor: "#FEF3C7", 
                        borderColor: "#F59E0B", 
                        borderWidth: 1, 
                        borderRadius: 20, 
                        paddingHorizontal: 8, 
                        paddingVertical: 2,
                        marginTop: 4
                      }}>
                        <Text style={{ color: "#D97706", fontSize: 9, fontWeight: "900" }}>
                          PENDING ACCEPTANCE
                        </Text>
                      </View>
                    </View>
                    
                    <Pressable 
                      onPress={() => {
                        Alert.alert(
                          "Withdraw Invitation",
                          `Are you sure you want to withdraw the invitation sent to ${inv.user?.name || inv.user?.email || "this engineer"}? This will return them to available state.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Withdraw", 
                              style: "destructive", 
                              onPress: () => {
                                removeInviteMutation.mutate(inv.id, {
                                  onSuccess: () => Alert.alert("Withdrawn", "The invitation was removed successfully."),
                                  onError: (error) =>
                                    Alert.alert("Withdraw Failed", error instanceof Error ? error.message : "Please try again."),
                                });
                              } 
                            }
                          ]
                        );
                      }}
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        borderRadius: 8,
                        padding: 8
                      }}
                    >
                      <Ionicons name="trash" size={18} color={COLORS.ERROR} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Engineer LinkedIn Profile Modal */}
      {viewingEngineer && (
        <Modal
          visible={!!viewingEngineer}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setViewingEngineer(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Header */}
              <View style={styles.modalHeader}>
                {viewingEngineer.avatar && (
                  <Image 
                    source={{ uri: viewingEngineer.avatar }} 
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: COLORS.MUTED }} 
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSubtitle}>VERIFIED ENGINEER PROFILE</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Text style={styles.modalTitle}>{viewingEngineer.name}</Text>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.PRIMARY} />
                  </View>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>{viewingEngineer.specialty}</Text>
                </View>
                <Pressable onPress={() => setViewingEngineer(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
                </Pressable>
              </View>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                {(["overview", "docs", "ratings", "jobs"] as const).map(tab => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabtext]}>
                      {tab.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 36 }}>
                
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={styles.sectionLabel}>Biography</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19 }}>
                        {viewingEngineer.bio}
                      </Text>
                    </View>

                    {/* Profile Gallery */}
                    {viewingEngineer.gallery && viewingEngineer.gallery.length > 0 && (
                      <View>
                        <Text style={styles.sectionLabel}>Project Portfolio Gallery</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 4 }}>
                          {viewingEngineer.gallery.map((imgUrl, i) => (
                            <Pressable key={i} onPress={() => setFullscreenImage(imgUrl)}>
                              <Image 
                                source={{ uri: imgUrl }} 
                                style={{ width: 90, height: 70, borderRadius: 8, backgroundColor: COLORS.BORDER_LIGHT }} 
                              />
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={styles.statBox}>
                        <Text style={styles.statNum}>{viewingEngineer.rating}</Text>
                        <Text style={styles.statLabel}>Average Rating</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statNum}>{viewingEngineer.completedJobsCount}</Text>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                      </View>
                    </View>

                    <View style={{ gap: 8 }}>
                      <Text style={styles.sectionLabel}>Secure Communication</Text>
                      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 19 }}>
                        Contact details stay private until work is agreed inside Inkingi. Use in-app chat to discuss proposal terms securely.
                      </Text>
                      <Pressable
                        onPress={() => {
                          setViewingEngineer(null);
                          router.push("/(client)/messages" as never);
                        }}
                        style={{
                          alignItems: "center",
                          backgroundColor: COLORS.PRIMARY,
                          borderRadius: 10,
                          flexDirection: "row",
                          gap: 8,
                          justifyContent: "center",
                          paddingVertical: 12,
                        }}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.TEXT_WHITE} />
                        <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 13, fontWeight: "900" }}>Message Contractor</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Documents & Certifications Tab */}
                {activeTab === "docs" && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.sectionLabel}>Verified Certifications</Text>
                    {viewingEngineer.certifications.map((cert, idx) => (
                      <View key={idx} style={styles.docRow}>
                        <Ionicons name="document-text-outline" size={20} color={COLORS.PRIMARY} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                            {cert}
                          </Text>
                          <Text style={{ color: COLORS.SUCCESS, fontSize: 11, fontWeight: "bold", marginTop: 2 }}>
                            Verified • Active License
                          </Text>
                        </View>
                        <Pressable 
                          onPress={() => handleViewDocument(cert)} 
                          style={{ padding: 6, backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8 }}
                        >
                          <Ionicons name="eye-outline" size={16} color={COLORS.PRIMARY_DARK} />
                        </Pressable>
                      </View>
                    ))}
                    
                    <View style={styles.docRow}>
                      <Ionicons name="shield-checkmark" size={20} color={COLORS.PRIMARY} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                          KYC Document Verification
                        </Text>
                        <Text style={{ color: COLORS.SUCCESS, fontSize: 11, fontWeight: "bold", marginTop: 2 }}>
                          APPROVED (National ID & IER Registry Matched)
                        </Text>
                      </View>
                      <Pressable 
                        onPress={() => handleViewDocument("KYC Document (National ID)")} 
                        style={{ padding: 6, backgroundColor: COLORS.PRIMARY_LIGHT, borderRadius: 8 }}
                      >
                        <Ionicons name="eye-outline" size={16} color={COLORS.PRIMARY_DARK} />
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Ratings & Client Feedback Tab */}
                {activeTab === "ratings" && (
                  <View style={{ gap: 14 }}>
                    <Text style={styles.sectionLabel}>Client Feedback & Ratings</Text>
                    {viewingEngineer.recentJobs.map(job => (
                      <View key={job.id} style={styles.feedbackCard}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                            Client: {job.clientName}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>
                              {job.rating}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, marginTop: 2 }}>
                          Project: {job.title}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>
                          {job.feedback}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent Jobs / Supervision History Tab */}
                {activeTab === "jobs" && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.sectionLabel}>Previous Supervision History</Text>
                    {viewingEngineer.recentJobs.map(job => (
                      <View key={job.id} style={styles.jobRow}>
                        <Ionicons name="briefcase-outline" size={20} color={COLORS.PRIMARY} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                            {job.title}
                          </Text>
                          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 2 }}>
                            Completed on: {job.completionDate}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

              </ScrollView>

              {/* Send Invitation Button */}
              <Pressable
                onPress={() => handleSendInvite(viewingEngineer.id, viewingEngineer.name || undefined)}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="paper-plane-outline" size={18} color={COLORS.TEXT_WHITE} />
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold", fontSize: 14 }}>
                  Invite to Project Workspace
                </Text>
              </Pressable>

            </View>
          </View>
        </Modal>
      )}

      {/* Fullscreen Image Gallery Modal */}
      {fullscreenImage && (
        <Modal
          visible={!!fullscreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreenImage(null)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}
            onPress={() => setFullscreenImage(null)}
          >
            <Image 
              source={{ uri: fullscreenImage }} 
              style={{ width: "95%", height: "65%", borderRadius: 12, backgroundColor: "black" }} 
              resizeMode="contain"
            />
            <Text style={{ color: "white", fontSize: 12, fontWeight: "bold", marginTop: 20 }}>
              Tap anywhere to close
            </Text>
            {viewingEngineer?.gallery && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 25 }}>
                {viewingEngineer.gallery.map((img, i) => (
                  <Pressable key={i} onPress={(e) => { e.stopPropagation(); setFullscreenImage(img); }}>
                    <Image 
                      source={{ uri: img }} 
                      style={{ 
                        width: 54, 
                        height: 54, 
                        borderRadius: 6, 
                        borderWidth: fullscreenImage === img ? 2 : 0, 
                        borderColor: COLORS.PRIMARY 
                      }} 
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        </Modal>
      )}

      {/* Document View Selector Modal */}
      {selectedDoc && docViewerMode === "ask" && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSelectedDoc(null);
            setDocViewerMode(null);
          }}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: COLORS.BACKGROUND, borderRadius: 16, padding: 24, width: "85%", gap: 16 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
                Open Document
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, textAlign: "center" }}>
                How would you like to view {selectedDoc}?
              </Text>
              
              <View style={{ gap: 10, marginTop: 8 }}>
                <Pressable
                  onPress={() => setDocViewerMode("preview")}
                  style={{ backgroundColor: COLORS.PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold", fontSize: 13 }}>
                    Use In-App Premium Viewer
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    setSelectedDoc(null);
                    setDocViewerMode(null);
                    Alert.alert("Redirecting", "Opening in external browser system webview...");
                  }}
                  style={{ backgroundColor: COLORS.MUTED, borderColor: COLORS.BORDER_LIGHT, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                    Open in External Browser
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    setSelectedDoc(null);
                    setDocViewerMode(null);
                  }}
                  style={{ paddingVertical: 8, alignItems: "center" }}
                >
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "bold", fontSize: 13 }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* In-App Document Preview Modal */}
      {selectedDoc && docViewerMode === "preview" && (
        <Modal
          visible={true}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setSelectedDoc(null);
            setDocViewerMode(null);
          }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
            <View style={{ padding: 16, backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER_LIGHT, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 14, fontWeight: "bold" }}>
                Previewing: {selectedDoc}
              </Text>
              <Pressable 
                onPress={() => {
                  setSelectedDoc(null);
                  setDocViewerMode(null);
                }} 
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center", gap: 20 }}>
              <View style={{ backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 30, borderWidth: 1, borderColor: COLORS.BORDER_LIGHT, width: "100%", minHeight: 450, justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
                <View style={{ alignItems: "center", gap: 16 }}>
                  <Ionicons name="ribbon-outline" size={72} color={COLORS.PRIMARY} />
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
                    INSTITUTE OF ENGINEERS RWANDA
                  </Text>
                  <View style={{ height: 2, backgroundColor: COLORS.PRIMARY, width: "60%" }} />
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, fontStyle: "italic", textAlign: "center", marginTop: 10 }}>
                    Official Certification Document
                  </Text>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 10 }}>
                    {selectedDoc}
                  </Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
                    This certifies that the holder is a registered, active member in good standing of the IER Board, authorized to supervise major residential and commercial infrastructure construction projects across Rwanda.
                  </Text>
                </View>
                
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "bold" }}>
                    Verified Authenticity QR Verified
                  </Text>
                  <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 10 }}>
                    Reference ID: IER-2026-REG-98231
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 6
  },
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
    alignItems: "center",
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    letterSpacing: 1
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    paddingBottom: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  activeTab: {
    borderBottomColor: COLORS.PRIMARY
  },
  tabText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.TEXT_SECONDARY
  },
  activeTabtext: {
    color: COLORS.PRIMARY
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.MUTED,
    borderRadius: 8,
    padding: 12,
    alignItems: "center"
  },
  statNum: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.PRIMARY
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.MUTED,
    padding: 12,
    borderRadius: 8
  },
  feedbackCard: {
    backgroundColor: COLORS.MUTED,
    padding: 12,
    borderRadius: 8,
    gap: 2
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.MUTED,
    padding: 12,
    borderRadius: 8
  }
});
