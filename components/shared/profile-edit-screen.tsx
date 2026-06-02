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
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";

export function ProfileEditScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setUsername(user?.username || user?.displayUsername || "");
    setPhoneNumber(user?.phoneNumber || user?.phone || "");
    setImageUri(user?.image || user?.avatar || "");
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
      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        displayUsername: username.trim(),
        phoneNumber: phoneNumber.trim(),
        image: imageUri,
      });
      router.back();
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
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  keyboardType?: "default" | "phone-pad";
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
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={COLORS.TEXT_LIGHT}
          style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800", paddingVertical: 13 }}
          value={value}
        />
      </View>
    </View>
  );
}
