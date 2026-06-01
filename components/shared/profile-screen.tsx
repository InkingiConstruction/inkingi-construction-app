import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View style={{ gap: 6, marginBottom: 22 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
              Profile
            </Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
              Manage your account identity and contact information.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderColor: COLORS.BORDER_LIGHT,
              borderRadius: 18,
              borderWidth: 1,
              padding: 18,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderRadius: 42,
                  height: 84,
                  justifyContent: "center",
                  width: 84,
                }}
              >
                <Text style={{ color: COLORS.PRIMARY_DARK, fontSize: 28, fontWeight: "900" }}>
                  {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 12 }}>
                {user?.name || "Account user"}
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                {user?.email}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 12, flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "800" }}>ROLE</Text>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", marginTop: 4 }}>
                  {user?.role || "client"}
                </Text>
              </View>
              <View style={{ backgroundColor: COLORS.MUTED, borderRadius: 12, flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "800" }}>KYC</Text>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900", marginTop: 4 }}>
                  {user?.kycStatus || "pending"}
                </Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <ProfileInput icon="person-outline" label="Full name" value={name} onChangeText={setName} />
              <ProfileInput icon="at-outline" label="Username" value={username} onChangeText={setUsername} />
              <ProfileInput
                icon="call-outline"
                label="Phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {message ? (
              <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "800", marginTop: 12 }}>
                {message}
              </Text>
            ) : null}
            {error ? (
              <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 12 }}>
                {error}
              </Text>
            ) : null}

            <Pressable
              disabled={loading}
              onPress={save}
              style={{
                alignItems: "center",
                backgroundColor: COLORS.PRIMARY,
                borderRadius: 12,
                marginTop: 18,
                opacity: loading ? 0.7 : 1,
                paddingVertical: 15,
              }}
            >
              <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                {loading ? "Saving..." : "Save Profile"}
              </Text>
            </Pressable>

            <Pressable
              onPress={logout}
              style={{
                alignItems: "center",
                borderColor: COLORS.ERROR,
                borderRadius: 12,
                borderWidth: 1,
                flexDirection: "row",
                gap: 8,
                justifyContent: "center",
                marginTop: 12,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.ERROR} />
              <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Logout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    <View
      style={{
        alignItems: "center",
        backgroundColor: COLORS.MUTED,
        borderRadius: 12,
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
      }}
    >
      <Ionicons name={icon} size={18} color={COLORS.TEXT_LIGHT} />
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "700" }}
        value={value}
      />
    </View>
  );
}
