import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setUsername(user?.username || user?.displayUsername || "");
    setPhoneNumber(user?.phoneNumber || user?.phone || "");
  }, [user]);

  const completion = useMemo(() => {
    let score = 20;
    if (user?.emailVerified) score += 20;
    if (user?.phoneNumber || user?.phone) score += 20;
    if (user?.username || user?.displayUsername) score += 15;
    if (user?.kycStatus === "approved") score += 25;
    return Math.min(score, 100);
  }, [user]);

  const save = async () => {
    setMessage("");
    setError("");
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        displayUsername: username.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>
              My Profile
            </Text>
          </View>

          <View style={{ alignItems: "center", flexDirection: "row", gap: 14, marginBottom: 20 }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: COLORS.PRIMARY_LIGHT,
                borderRadius: 28,
                height: 56,
                justifyContent: "center",
                overflow: "hidden",
                width: 56,
              }}
            >
              {user?.image || user?.avatar ? (
                <Image
                  source={{ uri: user.image || user.avatar || "" }}
                  style={{ height: 56, width: 56 }}
                />
              ) : (
                <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 22, fontWeight: "900" }}>
                  {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "900" }}>
                {user?.name || "Account user"}
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 3 }}>
                {user?.email || "No email"}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#B9F000",
              borderRadius: 10,
              flexDirection: "row",
              marginBottom: 16,
              minHeight: 108,
              overflow: "hidden",
              padding: 16,
            }}
          >
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: COLORS.INK, fontSize: 14, fontWeight: "900" }}>
                  Profile Verification
                </Text>
                <Text style={{ color: COLORS.INK, fontSize: 13, marginTop: 4 }}>
                  {user?.kycStatus === "approved" ? "Verified account" : `${user?.kycStatus || "pending"} KYC`}
                </Text>
              </View>
              <Pressable
                onPress={save}
                disabled={loading}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: COLORS.SURFACE,
                  borderRadius: 6,
                  opacity: loading ? 0.7 : 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: COLORS.INK, fontSize: 12, fontWeight: "900" }}>
                  {loading ? "Saving" : "Update profile"}
                </Text>
              </Pressable>
            </View>
            <View style={{ alignItems: "center", justifyContent: "center", width: 92 }}>
              <View
                style={{
                  alignItems: "center",
                  borderColor: COLORS.INK,
                  borderRadius: 38,
                  borderRightColor: "rgba(15, 23, 42, 0.18)",
                  borderWidth: 5,
                  height: 76,
                  justifyContent: "center",
                  width: 76,
                }}
              >
                <Text style={{ color: COLORS.INK, fontSize: 20, fontWeight: "900" }}>
                  {completion}%
                </Text>
              </View>
            </View>
          </View>

          {message ? (
            <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "800", marginBottom: 10 }}>
              {message}
            </Text>
          ) : null}
          {error ? (
            <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginBottom: 10 }}>
              {error}
            </Text>
          ) : null}

          <Group title="ACCOUNT">
            <ProfileInput icon="person-outline" label="Full name" value={name} onChangeText={setName} />
            <ProfileInput icon="at-outline" label="Username" value={username} onChangeText={setUsername} />
            <ProfileInput
              icon="call-outline"
              label="Phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <MenuRow
              icon="shield-checkmark-outline"
              label="Role & verification"
              value={user?.role || "client"}
            />
          </Group>

          <Group title="PREFERENCE">
            <MenuRow icon="language-outline" label="Language" value="English (USA)" />
            <View style={rowStyle}>
              <View style={rowIconStyle}>
                <Ionicons name="moon-outline" size={18} color={COLORS.TEXT_SECONDARY} />
              </View>
              <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800" }}>
                Dark Mode
              </Text>
              <Switch
                value={preference === "dark"}
                onValueChange={(value) => setPreference(value ? "dark" : "light")}
                trackColor={{ false: COLORS.CONCRETE, true: "#B9F000" }}
                thumbColor={COLORS.SURFACE}
              />
            </View>
          </Group>

          <View style={{ ...groupStyle, marginBottom: 24 }}>
            <MenuRow icon="headset-outline" label="Help Center" />
          </View>

          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable
              onPress={handleLogout}
              style={{ alignItems: "center", flexDirection: "row", gap: 8, paddingVertical: 12 }}
            >
              <Ionicons name="log-out-outline" size={19} color={COLORS.ERROR} />
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>Log Out</Text>
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

type ProfileInputProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  keyboardType?: "default" | "phone-pad";
  onChangeText: (value: string) => void;
};

function ProfileInput({ icon, label, value, keyboardType = "default", onChangeText }: ProfileInputProps) {
  return (
    <View style={rowStyle}>
      <View style={rowIconStyle}>
        <Ionicons name={icon} size={16} color={COLORS.TEXT_SECONDARY} />
      </View>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800", paddingVertical: 0 }}
        value={value}
      />
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
