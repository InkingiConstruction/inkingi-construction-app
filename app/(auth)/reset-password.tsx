import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      });
      setMessage("Password updated successfully.");
      router.replace("/(auth)/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 42,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{ paddingVertical: 8 }}
            >
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "900" }}>
                Back
              </Text>
            </Pressable>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.INK} />
          </View>
          <Text
            style={{
              color: COLORS.TEXT_PRIMARY,
              fontSize: 30,
              fontWeight: "900",
              marginTop: 44,
            }}
          >
            Reset
            {"\n"}your password.
          </Text>
          <Text
            style={{
              color: COLORS.TEXT_SECONDARY,
              fontSize: 13,
              lineHeight: 20,
              marginTop: 8,
            }}
          >
            Use the verification code and create a new secure password.
          </Text>
          <View style={{ gap: 12, marginTop: 24 }}>
            <TextInput
              autoCapitalize="none"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              style={{
                backgroundColor: COLORS.MUTED,
                borderRadius: 10,
                color: COLORS.TEXT_PRIMARY,
                padding: 14,
              }}
              value={email}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={setOtp}
              placeholder="OTP"
              placeholderTextColor={COLORS.STEEL}
              style={{
                backgroundColor: "#FAD08A",
                borderRadius: 10,
                color: COLORS.INK,
                padding: 14,
              }}
              value={otp}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={COLORS.TEXT_LIGHT}
              secureTextEntry
              style={{
                backgroundColor: COLORS.MUTED,
                borderRadius: 10,
                color: COLORS.TEXT_PRIMARY,
                padding: 14,
              }}
              value={password}
            />
          </View>
          {message ? (
            <Text
              style={{
                color: COLORS.SUCCESS,
                fontSize: 12,
                fontWeight: "800",
                marginTop: 10,
              }}
            >
              {message}
            </Text>
          ) : null}
          {error ? (
            <Text
              style={{
                color: COLORS.ERROR,
                fontSize: 12,
                fontWeight: "800",
                marginTop: 10,
              }}
            >
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
              marginTop: 20,
              opacity: loading ? 0.7 : 1,
              paddingVertical: 16,
            }}
          >
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {loading ? "Saving..." : "Save Password"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
