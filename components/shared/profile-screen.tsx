import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const imageUri = user?.image || user?.avatar || "";

  const completion = useMemo(() => {
    let score = 20;
    if (user?.emailVerified) score += 20;
    if (user?.phoneNumber || user?.phone) score += 20;
    if (user?.username || user?.displayUsername) score += 15;
    if (user?.kycStatus === "approved") score += 25;
    return Math.min(score, 100);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const openEditProfile = () => {
    const role = user?.role === "engineer" || user?.role === "supervisor" || user?.role === "supplier"
      ? user.role
      : "client";
    router.push(`/(${role})/profile-edit` as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
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
                Profile
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                Account, verification, and preferences
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: COLORS.PRIMARY_DARK,
              borderRadius: 8,
              marginBottom: 16,
              overflow: "hidden",
              padding: 18,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.22)",
                height: 84,
                position: "absolute",
                right: -24,
                top: -18,
                transform: [{ rotate: "-14deg" }],
                width: 180,
              }}
            />
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                bottom: -28,
                height: 88,
                left: -20,
                position: "absolute",
                transform: [{ rotate: "10deg" }],
                width: 160,
              }}
            />
            <View style={{ alignItems: "center", flexDirection: "row", gap: 14 }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.SURFACE,
                  borderColor: "rgba(255, 255, 255, 0.58)",
                  borderRadius: 32,
                  borderWidth: 3,
                  height: 64,
                  justifyContent: "center",
                  overflow: "hidden",
                  width: 64,
                }}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={{ height: 64, width: 64 }}
                  />
                ) : (
                  <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 22, fontWeight: "900" }}>
                    {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 21, fontWeight: "900" }}>
                  {user?.name || "Account user"}
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                  {user?.email || "No email"}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: user?.emailVerified ? "rgba(209, 250, 229, 0.20)" : "rgba(245, 158, 11, 0.24)",
                    borderColor: user?.emailVerified ? "rgba(209, 250, 229, 0.45)" : "rgba(245, 158, 11, 0.48)",
                    borderRadius: 999,
                    borderWidth: 1,
                    flexDirection: "row",
                    gap: 6,
                    marginTop: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Ionicons
                    name={user?.emailVerified ? "checkmark-circle" : "time-outline"}
                    size={14}
                    color={user?.emailVerified ? COLORS.PRIMARY_LIGHT : COLORS.GOLD}
                  />
                  <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 11, fontWeight: "900" }}>
                    {user?.emailVerified ? "Email verified" : "Email pending"}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 16,
              }}
            >
              <StatusPill
                icon="person-badge-outline"
                label={(user?.role || "client").toUpperCase()}
              />
              <StatusPill
                icon="document-text-outline"
                label={(user?.kycStatus || "not submitted").replace(/_/g, " ").toUpperCase()}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 8,
              borderWidth: 1,
              flexDirection: "row",
              marginBottom: 16,
              minHeight: 108,
              overflow: "hidden",
              padding: 16,
            }}
          >
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 14, fontWeight: "900" }}>
                  Profile Verification
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, fontWeight: "700", marginTop: 4 }}>
                  {user?.kycStatus === "approved" ? "Verified account" : `${user?.kycStatus || "pending"} KYC`}
                </Text>
              </View>
              <Pressable
                onPress={openEditProfile}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: COLORS.PRIMARY,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12, fontWeight: "900" }}>
                  Update profile
                </Text>
              </Pressable>
            </View>
            <View style={{ alignItems: "center", justifyContent: "center", width: 92 }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.PRIMARY,
                  borderRadius: 38,
                  borderRightColor: COLORS.GOLD,
                  borderWidth: 5,
                  height: 76,
                  justifyContent: "center",
                  width: 76,
                }}
              >
                <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 20, fontWeight: "900" }}>
                  {completion}%
                </Text>
              </View>
            </View>
          </View>

          <Group title="ACCOUNT">
            <MenuRow icon="person-outline" label="Full name" value={user?.name || "Not set"} />
            <MenuRow icon="at-outline" label="Username" value={user?.username || user?.displayUsername || "Not set"} />
            <MenuRow icon="call-outline" label="Phone number" value={user?.phoneNumber || user?.phone || "Not set"} />
            <MenuRow icon="mail-outline" label="Email" value={user?.email || "No email"} />
            <MenuRow icon="shield-checkmark-outline" label="Role" value={user?.role || "client"} />
          </Group>

          <Group title="VERIFICATION">
            <MenuRow
              icon={user?.emailVerified ? "checkmark-circle-outline" : "time-outline"}
              label="Email status"
              value={user?.emailVerified ? "verified" : "pending"}
            />
            <MenuRow
              icon={user?.phoneNumberVerified ? "checkmark-circle-outline" : "time-outline"}
              label="Phone status"
              value={user?.phoneNumberVerified ? "verified" : "pending"}
            />
            <MenuRow
              icon="document-text-outline"
              label="KYC status"
              value={(user?.kycStatus || "not submitted").replace(/_/g, " ")}
            />
          </Group>

          <Group title="PREFERENCES">
            <MenuRow icon="language-outline" label="Language" value="English (USA)" />
            <View style={rowStyle}>
              <View style={rowIconStyle}>
                <Ionicons name="moon-outline" size={18} color={COLORS.PRIMARY_DARK} />
              </View>
              <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800" }}>
                Dark Mode
              </Text>
              <Switch
                value={preference === "dark"}
                onValueChange={(value) => setPreference(value ? "dark" : "light")}
                trackColor={{ false: COLORS.CONCRETE, true: COLORS.PRIMARY }}
                thumbColor={COLORS.SURFACE}
              />
            </View>
          </Group>

          <View style={{ ...groupStyle, marginBottom: 24 }}>
            <MenuRow icon="headset-outline" label="Help Center" value="Support" />
          </View>

          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable
              onPress={handleLogout}
              style={{
                alignItems: "center",
                backgroundColor: COLORS.SURFACE,
                borderColor: "rgba(220, 38, 38, 0.18)",
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: "row",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Ionicons name="log-out-outline" size={19} color={COLORS.ERROR} />
              <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Log Out</Text>
            </Pressable>
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const groupStyle = {
  backgroundColor: COLORS.MUTED,
  borderRadius: 10,
  marginBottom: 12,
  overflow: "hidden" as const,
  paddingVertical: 8,
};

const rowStyle = {
  alignItems: "center" as const,
  flexDirection: "row" as const,
  gap: 10,
  minHeight: 48,
  paddingHorizontal: 14,
  paddingVertical: 10,
};

const rowIconStyle = {
  alignItems: "center" as const,
  borderColor: COLORS.BORDER,
  borderRadius: 7,
  borderWidth: 1,
  height: 24,
  justifyContent: "center" as const,
  width: 24,
};

function StatusPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderColor: "rgba(255, 255, 255, 0.18)",
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
      }}
    >
      <Ionicons name={icon} size={13} color={COLORS.GOLD} />
      <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 10, fontWeight: "900" }}>
        {label}
      </Text>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={groupStyle}>
      <Text
        style={{
          color: COLORS.TEXT_SECONDARY,
          fontSize: 12,
          fontWeight: "800",
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={rowStyle}>
      <View style={rowIconStyle}>
        <Ionicons name={icon} size={16} color={COLORS.TEXT_SECONDARY} />
      </View>
      <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800" }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "700", marginRight: 4 }}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
    </View>
  );
}
