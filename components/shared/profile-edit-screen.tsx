import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";

type RecentWork = {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: string;
  clientName: string;
  completionDate: string;
  progress: string;
  status: string;
  milestones: string;
  rating: string;
  feedback: string;
  imageUrl?: string;
  imageUri?: string;
};

const asText = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const isLocalFile = (uri?: string) =>
  typeof uri === "string" &&
  (uri.startsWith("file") || uri.startsWith("content:"));

const joinList = (value: unknown) =>
  Array.isArray(value) ? value.map(String).join(", ") : asText(value);

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function ProfileEditScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [certifications, setCertifications] = useState("");
  const [areasOfExpertise, setAreasOfExpertise] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [projectsCompleted, setProjectsCompleted] = useState("");
  const [activeProjects, setActiveProjects] = useState("");
  const [successRate, setSuccessRate] = useState("");
  const [clientSatisfaction, setClientSatisfaction] = useState("");
  const [achievements, setAchievements] = useState("");
  const [recentWorks, setRecentWorks] = useState<RecentWork[]>([]);
  const [error, setError] = useState("");
  const isProfessionalProfile =
    user?.role === "engineer" || user?.role === "supervisor";

  useEffect(() => {
    const roleSpecific =
      user?.roleSpecific && typeof user.roleSpecific === "object"
        ? (user.roleSpecific as Record<string, unknown>)
        : {};

    setName(user?.name || "");
    setUsername(user?.username || user?.displayUsername || "");
    setPhoneNumber(user?.phoneNumber || user?.phone || "");
    setImageUri(user?.image || user?.avatar || "");
    setBio(asText(roleSpecific.bio || user?.bio));
    setSpecialty(
      asText(
        roleSpecific.specialization ||
          roleSpecific.specialty ||
          roleSpecific.focusArea ||
          roleSpecific.fieldOfExpertise ||
          roleSpecific.engineerType ||
          roleSpecific.supervisorType,
      ),
    );
    setYearsOfExperience(asText(roleSpecific.yearsOfExperience));
    setSkills(joinList(roleSpecific.skills));
    setQualifications(joinList(roleSpecific.qualifications));
    setCertifications(joinList(roleSpecific.certifications));
    setAreasOfExpertise(joinList(roleSpecific.areasOfExpertise));
    setAvailabilityStatus(asText(roleSpecific.availabilityStatus) || "Available");
    setProjectsCompleted(asText(roleSpecific.projectsCompleted || roleSpecific.completedJobsCount));
    setActiveProjects(asText(roleSpecific.activeProjects));
    setSuccessRate(asText(roleSpecific.successRate));
    setClientSatisfaction(asText(roleSpecific.clientSatisfactionScore));
    setAchievements(joinList(roleSpecific.achievements));
    setRecentWorks(
      Array.isArray(roleSpecific.recentJobs)
        ? roleSpecific.recentJobs.map((item, index) => {
            const work =
              item && typeof item === "object"
                ? (item as Record<string, unknown>)
                : {};
            return {
              id: asText(work.id) || `work-${index}-${Date.now()}`,
              title: asText(work.title),
              description: asText(work.description),
              location: asText(work.location || work.district),
              budget: asText(work.budget),
              clientName: asText(work.clientName),
              completionDate: asText(work.completionDate),
              progress: asText(work.progress || 100),
              status: asText(work.status || "Completed"),
              milestones: joinList(work.milestones),
              rating: asText(work.rating || ""),
              feedback: asText(work.feedback),
              imageUrl: asText(work.imageUrl || work.photoUrl) || undefined,
            };
          })
        : [],
    );
  }, [user]);

  const pickProfileImage = async () => {
    setError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Allow gallery access to update your profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.82,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      const normalizedWorks = recentWorks
        .filter(
          (work) =>
            work.title.trim() ||
            work.description.trim() ||
            work.location.trim() ||
            work.feedback.trim() ||
            work.imageUri ||
            work.imageUrl,
        )
        .map((work, index) => ({
          id: work.id || `work-${index}`,
          title: work.title.trim() || "Recent Rwanda project",
          description: work.description.trim(),
          location: work.location.trim() || "Rwanda",
          budget: work.budget.trim(),
          clientName: work.clientName.trim(),
          completionDate: work.completionDate.trim(),
          progress: Math.max(0, Math.min(100, Number(work.progress || 0))),
          status: work.status || "Completed",
          milestones: splitList(work.milestones),
          rating: work.rating.trim() ? Number(work.rating) : undefined,
          feedback: work.feedback.trim(),
          imageUrl: isLocalFile(work.imageUri)
            ? work.imageUrl
            : work.imageUri || work.imageUrl,
        }));
      const portfolioImages = recentWorks
        .filter((work) => isLocalFile(work.imageUri))
        .map((work) => ({
          uri: work.imageUri as string,
          index: normalizedWorks.findIndex((item) => item.id === work.id),
        }))
        .filter((item) => item.index >= 0);
      const currentRoleSpecific =
        user?.roleSpecific && typeof user.roleSpecific === "object"
          ? (user.roleSpecific as Record<string, unknown>)
          : {};
      const nextRoleSpecific = isProfessionalProfile
        ? {
            ...currentRoleSpecific,
            bio: bio.trim(),
            specialty: specialty.trim(),
            specialization: specialty.trim(),
            focusArea: specialty.trim(),
            yearsOfExperience: yearsOfExperience.trim(),
            skills: splitList(skills),
            qualifications: splitList(qualifications),
            certifications: splitList(certifications),
            areasOfExpertise: splitList(areasOfExpertise),
            availabilityStatus,
            achievements: splitList(achievements),
            projectsCompleted: Number(projectsCompleted || 0),
            completedJobsCount: Number(projectsCompleted || 0),
            activeProjects: Number(activeProjects || 0),
            successRate: Number(successRate || 0),
            clientSatisfactionScore: Number(clientSatisfaction || 0),
            recentJobs: normalizedWorks,
            gallery: normalizedWorks
              .map((work) => work.imageUrl)
              .filter((url) => url && !isLocalFile(url)),
          }
        : currentRoleSpecific;

      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        displayUsername: username.trim(),
        phoneNumber: phoneNumber.trim(),
        image: imageUri,
        roleSpecific: nextRoleSpecific,
        portfolioImages,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const addRecentWork = () => {
    setRecentWorks((current) => [
      ...current,
      {
        id: `work-${Date.now()}`,
        title: "",
        description: "",
        location: "",
        budget: "",
        clientName: "",
        completionDate: "",
        progress: "100",
        status: "Completed",
        milestones: "",
        rating: "",
        feedback: "",
      },
    ]);
  };

  const updateRecentWork = (id: string, patch: Partial<RecentWork>) => {
    setRecentWorks((current) =>
      current.map((work) => (work.id === id ? { ...work, ...patch } : work)),
    );
  };

  const removeRecentWork = (id: string) => {
    setRecentWorks((current) => current.filter((work) => work.id !== id));
  };

  const pickRecentWorkImage = async (id: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow gallery access to upload recent work photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      updateRecentWork(id, { imageUri: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUser} tintColor={COLORS.PRIMARY} />}
        >
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{
                alignItems: "center",
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderRadius: 10,
                borderWidth: 1,
                height: 38,
                justifyContent: "center",
                width: 38,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.PRIMARY_DARK} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "900" }}>
                Edit Profile
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                Update your photo and account details
              </Text>
            </View>
          </View>

          <View
            style={{
              alignItems: "center",
              backgroundColor: COLORS.PRIMARY_DARK,
              borderRadius: 8,
              marginBottom: 14,
              overflow: "hidden",
              padding: 20,
            }}
          >
            <Pressable
              onPress={pickProfileImage}
              style={{
                alignItems: "center",
                backgroundColor: COLORS.SURFACE,
                borderColor: "rgba(255, 255, 255, 0.58)",
                borderRadius: 54,
                borderWidth: 4,
                height: 108,
                justifyContent: "center",
                marginBottom: 12,
                overflow: "hidden",
                width: 108,
              }}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ height: 108, width: 108 }} />
              ) : (
                <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 34, fontWeight: "900" }}>
                  {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                </Text>
              )}
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.GOLD,
                  borderColor: COLORS.PRIMARY_DARK,
                  borderRadius: 16,
                  borderWidth: 2,
                  bottom: 4,
                  height: 32,
                  justifyContent: "center",
                  position: "absolute",
                  right: 4,
                  width: 32,
                }}
              >
                <Ionicons name="camera" size={15} color={COLORS.INK} />
              </View>
            </Pressable>
            <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 15, fontWeight: "900" }}>
              Change profile photo
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "700", marginTop: 4 }}>
              Use a clear photo for easier project communication.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 8,
              borderWidth: 1,
              marginBottom: 14,
              padding: 14,
            }}
          >
            <Field label="Full name" icon="person-outline" value={name} onChangeText={setName} />
            <Field label="Username" icon="at-outline" value={username} onChangeText={setUsername} />
            <Field
              label="Phone number"
              icon="call-outline"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <View style={{ marginTop: 4 }}>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800", marginBottom: 7 }}>
                Email
              </Text>
              <View
                style={{
                  backgroundColor: COLORS.MUTED,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderRadius: 8,
                  borderWidth: 1,
                  padding: 13,
                }}
              >
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "800" }}>
                  {user?.email || "No email"}
                </Text>
              </View>
            </View>
          </View>

          {isProfessionalProfile ? (
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderRadius: 8,
                borderWidth: 1,
                marginBottom: 14,
                padding: 14,
              }}
            >
              <View
                style={{
                  alignItems: "flex-start",
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderRadius: 10,
                    height: 38,
                    justifyContent: "center",
                    width: 38,
                  }}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={19}
                    color={COLORS.PRIMARY_DARK}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.TEXT_PRIMARY,
                      fontSize: 16,
                      fontWeight: "900",
                    }}
                  >
                    Professional profile
                  </Text>
                  <Text
                    style={{
                      color: COLORS.TEXT_SECONDARY,
                      fontSize: 12,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    Add Rwanda-based work, photos, and progress so clients can understand your experience before inviting you.
                  </Text>
                </View>
              </View>

              <Field
                label={user?.role === "supervisor" ? "Focus area" : "Specialty"}
                icon="ribbon-outline"
                value={specialty}
                onChangeText={setSpecialty}
              />
              <Field
                label="Years of experience"
                icon="calendar-outline"
                keyboardType="number-pad"
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
              />
              <Field
                label="Professional bio"
                icon="document-text-outline"
                multiline
                value={bio}
                onChangeText={setBio}
              />
              <Field
                label="Skills (comma separated)"
                icon="construct-outline"
                value={skills}
                onChangeText={setSkills}
              />
              <Field
                label="Qualifications (comma separated)"
                icon="school-outline"
                value={qualifications}
                onChangeText={setQualifications}
              />
              <Field
                label="Certifications (comma separated)"
                icon="shield-checkmark-outline"
                value={certifications}
                onChangeText={setCertifications}
              />
              <Field
                label="Areas of expertise (comma separated)"
                icon="map-outline"
                value={areasOfExpertise}
                onChangeText={setAreasOfExpertise}
              />
              <Field
                label="Achievements (comma separated)"
                icon="trophy-outline"
                value={achievements}
                onChangeText={setAchievements}
              />

              <OptionGroup
                label="Availability"
                options={["Available", "Busy", "On Leave"]}
                value={availabilityStatus}
                onChange={setAvailabilityStatus}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Completed"
                    icon="checkmark-done-outline"
                    keyboardType="number-pad"
                    value={projectsCompleted}
                    onChangeText={(value) =>
                      setProjectsCompleted(value.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Active"
                    icon="pulse-outline"
                    keyboardType="number-pad"
                    value={activeProjects}
                    onChangeText={(value) =>
                      setActiveProjects(value.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Success %"
                    icon="trending-up-outline"
                    keyboardType="number-pad"
                    value={successRate}
                    onChangeText={(value) =>
                      setSuccessRate(value.replace(/[^0-9]/g, "").slice(0, 3))
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Satisfaction %"
                    icon="happy-outline"
                    keyboardType="number-pad"
                    value={clientSatisfaction}
                    onChangeText={(value) =>
                      setClientSatisfaction(value.replace(/[^0-9]/g, "").slice(0, 3))
                    }
                  />
                </View>
              </View>

              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                    fontSize: 14,
                    fontWeight: "900",
                  }}
                >
                  Recent Rwanda work
                </Text>
                <Pressable
                  onPress={addRecentWork}
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderRadius: 8,
                    flexDirection: "row",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons name="add" size={16} color={COLORS.PRIMARY_DARK} />
                  <Text
                    style={{
                      color: COLORS.PRIMARY_DARK,
                      fontSize: 12,
                      fontWeight: "900",
                    }}
                  >
                    Add work
                  </Text>
                </Pressable>
              </View>

              {recentWorks.length === 0 ? (
                <View
                  style={{
                    backgroundColor: COLORS.BACKGROUND,
                    borderColor: COLORS.BORDER_LIGHT,
                    borderRadius: 8,
                    borderWidth: 1,
                    padding: 14,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.TEXT_SECONDARY,
                      fontSize: 12,
                      lineHeight: 18,
                      textAlign: "center",
                    }}
                  >
                    No recent work added yet. Add completed or ongoing Rwanda projects with a photo and progress.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {recentWorks.map((work, index) => {
                    const previewUri = work.imageUri || work.imageUrl;

                    return (
                      <View
                        key={work.id}
                        style={{
                          backgroundColor: COLORS.BACKGROUND,
                          borderColor: COLORS.BORDER_LIGHT,
                          borderRadius: 8,
                          borderWidth: 1,
                          padding: 12,
                        }}
                      >
                        <View
                          style={{
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: COLORS.TEXT_PRIMARY,
                              fontSize: 13,
                              fontWeight: "900",
                            }}
                          >
                            Work #{index + 1}
                          </Text>
                          <Pressable
                            onPress={() => removeRecentWork(work.id)}
                            hitSlop={8}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={COLORS.ERROR}
                            />
                          </Pressable>
                        </View>

                        <Pressable
                          onPress={() => pickRecentWorkImage(work.id)}
                          style={{
                            alignItems: "center",
                            backgroundColor: COLORS.SURFACE,
                            borderColor: COLORS.BORDER_LIGHT,
                            borderRadius: 8,
                            borderWidth: 1,
                            height: 132,
                            justifyContent: "center",
                            marginBottom: 12,
                            overflow: "hidden",
                          }}
                        >
                          {previewUri ? (
                            <Image
                              source={{ uri: previewUri }}
                              style={{ height: "100%", width: "100%" }}
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="image-outline"
                                size={26}
                                color={COLORS.PRIMARY_DARK}
                              />
                              <Text
                                style={{
                                  color: COLORS.TEXT_SECONDARY,
                                  fontSize: 12,
                                  fontWeight: "800",
                                  marginTop: 6,
                                }}
                              >
                                Upload project photo
                              </Text>
                            </>
                          )}
                        </Pressable>

                        <Field
                          label="Project title"
                          icon="business-outline"
                          value={work.title}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { title: value })
                          }
                        />
                        <Field
                          label="Project description"
                          icon="document-text-outline"
                          multiline
                          value={work.description}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { description: value })
                          }
                        />
                        <Field
                          label="Location in Rwanda"
                          icon="location-outline"
                          value={work.location}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { location: value })
                          }
                        />
                        <Field
                          label="Budget"
                          icon="cash-outline"
                          keyboardType="number-pad"
                          value={work.budget}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, {
                              budget: value.replace(/[^0-9]/g, ""),
                            })
                          }
                        />
                        <OptionGroup
                          label="Project status"
                          options={["Planning", "In Progress", "Completed", "On Hold"]}
                          value={work.status}
                          onChange={(value) =>
                            updateRecentWork(work.id, { status: value })
                          }
                        />
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Field
                              label="Progress %"
                              icon="analytics-outline"
                              keyboardType="number-pad"
                              value={work.progress}
                              onChangeText={(value) =>
                                updateRecentWork(work.id, {
                                  progress: value
                                    .replace(/[^0-9]/g, "")
                                    .slice(0, 3),
                                })
                              }
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Field
                              label="Rating"
                              icon="star-outline"
                              keyboardType="number-pad"
                              value={work.rating}
                              onChangeText={(value) =>
                                updateRecentWork(work.id, {
                                  rating: value
                                    .replace(/[^0-9]/g, "")
                                    .slice(0, 1),
                                })
                              }
                            />
                          </View>
                        </View>
                        <Field
                          label="Client / organization"
                          icon="people-outline"
                          value={work.clientName}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { clientName: value })
                          }
                        />
                        <Field
                          label="Completion date"
                          icon="checkmark-done-outline"
                          value={work.completionDate}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { completionDate: value })
                          }
                        />
                        <Field
                          label="Milestones (comma separated)"
                          icon="flag-outline"
                          value={work.milestones}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { milestones: value })
                          }
                        />
                        <Field
                          label="Short result / feedback"
                          icon="chatbox-ellipses-outline"
                          multiline
                          value={work.feedback}
                          onChangeText={(value) =>
                            updateRecentWork(work.id, { feedback: value })
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}

          {error ? (
            <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            disabled={loading}
            onPress={save}
            style={{
              alignItems: "center",
              backgroundColor: loading ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
              borderRadius: 8,
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              paddingVertical: 15,
            }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.TEXT_WHITE} />
            ) : (
              <Ionicons name="checkmark" size={20} color={COLORS.TEXT_WHITE} />
            )}
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {loading ? "Saving changes..." : "Save changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  label,
  value,
  keyboardType = "default",
  multiline = false,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  multiline?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "800", marginBottom: 7 }}>
        {label}
      </Text>
      <View
        style={{
          alignItems: "center",
          backgroundColor: COLORS.BACKGROUND,
          borderColor: COLORS.BORDER_LIGHT,
          borderRadius: 8,
          borderWidth: 1,
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name={icon} size={17} color={COLORS.PRIMARY_DARK} />
        <TextInput
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={COLORS.TEXT_LIGHT}
          style={{
            color: COLORS.TEXT_PRIMARY,
            flex: 1,
            fontWeight: "800",
            minHeight: multiline ? 88 : undefined,
            paddingVertical: 13,
            textAlignVertical: multiline ? "top" : "center",
          }}
          value={value}
        />
      </View>
    </View>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text
        style={{
          color: COLORS.TEXT_SECONDARY,
          fontSize: 12,
          fontWeight: "800",
          marginBottom: 7,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={{
                backgroundColor: active ? COLORS.PRIMARY : COLORS.BACKGROUND,
                borderColor: active ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                borderRadius: 8,
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Text
                style={{
                  color: active ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY,
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
