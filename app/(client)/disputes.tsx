import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { useSampleFlowStore, MockDispute } from "@/store/sampleFlow.store";
import { formatRWF } from "@/utils/projectFunds";

const { width } = Dimensions.get("window");

export default function DisputesScreen() {
  const params = useLocalSearchParams<{ disputeId?: string }>();
  const { disputes, milestones, updateMilestoneStatus, bankAccounts } = useSampleFlowStore();
  const [selectedDisputeId, setSelectedDisputeId] = useState(params.disputeId || "");

  // If no specific dispute selected, pick the first one
  const activeDispute = disputes.find(d => d.id === selectedDisputeId) || disputes[0];

  // Actions to simulate mediator/admin decision in prototype
  const handleSimulateResolution = (decision: "refund" | "release" | "split") => {
    if (!activeDispute) return;

    let message = "";
    let statusText = "resolved";
    let desc = "";

    if (decision === "refund") {
      message = "Mediator ruled 100% refund of locked funds back to Client's escrow account.";
      desc = "Arbitrator concluded that engineer's work did not meet engineering building codes. Locked funds refunded to Client.";
    } else if (decision === "release") {
      message = "Mediator ruled 100% release of locked funds to the Engineer.";
      desc = "Arbitrator concluded that milestone deliverables were successfully built according to project specs. Escrow released to Engineer.";
    } else {
      message = "Mediator ruled 50/50 split of locked funds.";
      desc = "Arbitrator issued split proposal: 50% released to engineer for masonry work, 50% returned to client to cover plaster corrections.";
    }

    // Add event to timeline
    const updatedTimeline = [
      ...activeDispute.timeline,
      {
        date: new Date().toISOString(),
        title: "Mediation Decision Issued",
        desc
      }
    ];

    useSampleFlowStore.setState(state => ({
      disputes: state.disputes.map(d => 
        d.id === activeDispute.id 
          ? { ...d, status: "resolved" as const, timeline: updatedTimeline } 
          : d
      ),
      milestones: state.milestones.map(ms => 
        ms.id === activeDispute.milestoneId 
          ? { ...ms, status: decision === "refund" ? "revision_required" : "completed" } 
          : ms
      )
    }));

    Alert.alert("Decision Rendered", message);
  };

  const handleAppeal = () => {
    if (!activeDispute) return;

    // Check if already appealed
    const alreadyAppealed = activeDispute.timeline.some(t => t.title === "Appeal Lodged");
    if (alreadyAppealed) {
      Alert.alert("Appeal Limit", "You have already appealed this decision. The appeal is under final review.");
      return;
    }

    const updatedTimeline = [
      ...activeDispute.timeline,
      {
        date: new Date().toISOString(),
        title: "Appeal Lodged",
        desc: "Client appealed the mediator's resolution decision. Sent to the IER High Court Arbitration Board."
      }
    ];

    useSampleFlowStore.setState(state => ({
      disputes: state.disputes.map(d => 
        d.id === activeDispute.id 
          ? { ...d, timeline: updatedTimeline } 
          : d
      )
    }));

    Alert.alert("Appeal Registered", "Your appeal has been logged. Final review takes up to 7 days.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: 20 }}>
          <ClientTopBar
            title="Dispute Center"
            subtitle="Track and resolve milestone conflicts mediated by certified IER engineers."
            back={true}
          />
        </View>

        {disputes.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_LIGHT} />
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 12, textAlign: "center", lineHeight: 20 }}>
              No active disputes. Disputes are initiated when there&apos;s a conflict on milestone payment or building quality.
            </Text>
            <Pressable 
              onPress={() => router.push("/(client)/milestones" as never)}
              style={{
                marginTop: 20,
                backgroundColor: COLORS.PRIMARY,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 10
              }}
            >
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold" }}>View Milestones</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            
            {/* Dispute List Selector */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {disputes.map(d => (
                <Pressable
                  key={d.id}
                  onPress={() => setSelectedDisputeId(d.id)}
                  style={{
                    backgroundColor: activeDispute.id === d.id ? COLORS.PRIMARY : COLORS.SURFACE,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ 
                    color: activeDispute.id === d.id ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, 
                    fontWeight: "bold",
                    fontSize: 12
                  }}>
                    {d.id} - {d.projectName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Dispute details panel */}
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              
              {/* Main Card */}
              <View style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: COLORS.PRIMARY, fontWeight: "900" }}>
                    DISPUTE ID: {activeDispute.id}
                  </Text>
                  <StatusBadge status={activeDispute.status} />
                </View>

                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 8 }}>
                  Conflict: {activeDispute.milestoneName}
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, marginTop: 4 }}>
                  Project: <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold" }}>{activeDispute.projectName}</Text>
                </Text>

                <View style={{ 
                  backgroundColor: COLORS.MUTED, 
                  borderRadius: 10, 
                  padding: 12, 
                  marginTop: 12,
                  flexDirection: "row",
                  justifyContent: "space-between" 
                }}>
                  <View>
                    <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>LOCKED ESCROW BALANCE</Text>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.ERROR, marginTop: 2 }}>
                      {formatRWF(activeDispute.lockedAmount)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>CATEGORY</Text>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginTop: 2 }}>
                      {activeDispute.category}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Arbitrator Info */}
              <View style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16
              }}>
                <Text style={styles.sectionTitle}>Assigned Mediator</Text>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 10 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Ionicons name="person-circle-outline" size={24} color={COLORS.PRIMARY_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 14 }}>
                      {activeDispute.mediatorName}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                      Institute of Engineers Rwanda (IER)
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 10, borderTopColor: COLORS.BORDER_LIGHT, borderTopWidth: 1 }}>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>Resolution ETA</Text>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 12 }}>
                    {activeDispute.resolutionEta} (Average)
                  </Text>
                </View>
              </View>

              {/* Evidence Section */}
              {activeDispute.evidence.length > 0 && (
                <View style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 16
                }}>
                  <Text style={styles.sectionTitle}>Uploaded Evidence Files</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
                    {activeDispute.evidence.map((url, idx) => (
                      <View key={idx} style={{ position: "relative" }}>
                        <Image 
                          source={{ uri: url }} 
                          style={{ width: 120, height: 90, borderRadius: 8, backgroundColor: COLORS.MUTED }} 
                        />
                        <View style={{ 
                          position: "absolute", 
                          bottom: 4, 
                          left: 4, 
                          backgroundColor: "rgba(0,0,0,0.6)", 
                          borderRadius: 4, 
                          paddingHorizontal: 6, 
                          paddingVertical: 2 
                        }}>
                          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 9 }}>Proof #{idx+1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Timeline of events */}
              <View style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderWidth: 1,
                borderRadius: 14,
                padding: 16
              }}>
                <Text style={styles.sectionTitle}>Resolution Timeline</Text>
                
                <View style={{ gap: 16, marginTop: 14 }}>
                  {activeDispute.timeline.map((event, idx) => (
                    <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center" }}>
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: idx === 0 ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
                          alignItems: "center",
                          justifyContent: "center",
                          borderColor: COLORS.BORDER,
                          borderWidth: 1
                        }}>
                          <Ionicons 
                            name={idx === 0 ? "checkmark" : "time-outline"} 
                            size={12} 
                            color={idx === 0 ? COLORS.PRIMARY : COLORS.TEXT_LIGHT} 
                          />
                        </View>
                        {idx < activeDispute.timeline.length - 1 && (
                          <View style={{ width: 1, flex: 1, backgroundColor: COLORS.BORDER, marginVertical: 4 }} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "bold", fontSize: 13 }}>
                          {event.title}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 2 }}>
                          {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                          {event.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Prototype Helper: Simulate Decision */}
              {activeDispute.status === "open" && (
                <View style={{
                  backgroundColor: COLORS.MUTED,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 16,
                  gap: 10
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, textAlign: "center" }}>
                    PROTOTYPE SIMULATOR: ISSUE MEDIATION RULING
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => handleSimulateResolution("refund")}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.PRIMARY,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 10, fontWeight: "bold" }}>Refund Client</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSimulateResolution("release")}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.PRIMARY,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 10, fontWeight: "bold" }}>Release Eng</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSimulateResolution("split")}
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.PRIMARY,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 10, fontWeight: "bold" }}>Split 50/50</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Appeal / Action Card */}
              {activeDispute.status === "resolved" && (
                <View style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      Alert.alert("Thank you", "Decision accepted. Dispute closed.");
                      router.push("/(client)");
                    }}
                    style={{
                      backgroundColor: COLORS.PRIMARY,
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "bold" }}>Accept Decision</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={handleAppeal}
                    style={{
                      borderColor: COLORS.PRIMARY,
                      borderWidth: 1,
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: "center"
                    }}
                  >
                    <Text style={{ color: COLORS.PRIMARY, fontWeight: "bold" }}>Appeal Ruling (Once)</Text>
                  </Pressable>
                </View>
              )}

            </View>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: MockDispute["status"] }) {
  const isResolved = status === "resolved";
  return (
    <View style={{ 
      backgroundColor: isResolved ? "#DCFCE7" : "#FEE2E2", 
      borderRadius: 8, 
      paddingHorizontal: 8, 
      paddingVertical: 4 
    }}>
      <Text style={{ 
        color: isResolved ? COLORS.SUCCESS : COLORS.ERROR, 
        fontSize: 10, 
        fontWeight: "900" 
      }}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
});
