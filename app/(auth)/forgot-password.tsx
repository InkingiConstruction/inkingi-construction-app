import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await api.post(ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, { email: cleanEmail });
      router.push({ pathname: "/(auth)/reset-password", params: { email: cleanEmail } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 0,
            flex: 1,
            padding: 26,
            shadowColor: "#064E3B",
            shadowOpacity: 0,
            shadowRadius: 24,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 42 }}>
            <Pressable onPress={() => router.back()} style={{ paddingVertical: 8 }}>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "900" }}>Back</Text>
            </Pressable>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.INK} />
          </View>
          <View
            style={{
              alignItems: "center",
              backgroundColor: COLORS.PRIMARY_LIGHT,
              borderRadius: 22,
              height: 70,
              justifyContent: "center",
              marginBottom: 34,
              width: 70,
            }}
          >
            <Ionicons name="key-outline" size={34} color={COLORS.PRIMARY_DARK} />
          </View>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 30, fontWeight: "900" }}>
            Forgot password?
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
            Enter the email connected to your Inkingi account and continue to reset.
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={COLORS.TEXT_LIGHT}
            style={{
              backgroundColor: COLORS.MUTED,
              borderRadius: 10,
              color: COLORS.TEXT_PRIMARY,
              marginTop: 24,
              padding: 14,
            }}
            value={email}
          />
          {error ? (
            <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 10 }}>
              {error}
            </Text>
          ) : null}
          <Pressable
            disabled={loading}
            onPress={submit}
            style={{
              alignItems: "center",
              backgroundColor: COLORS.PRIMARY,
              borderRadius: 10,
              marginTop: 16,
              opacity: loading ? 0.7 : 1,
              paddingVertical: 16,
            }}
          >
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {loading ? "Sending code..." : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
