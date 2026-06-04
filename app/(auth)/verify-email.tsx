import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { getPostAuthRoute, useAuthStore, User } from "@/store/auth.store";

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verify = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post<{ message: string; user: User }>(ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      useAuthStore.setState({
        user: response.data.user,
        isAuthenticated: true,
      });
      setMessage("Email verified successfully.");
      router.replace(getPostAuthRoute(response.data.user) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setMessage("");
    try {
      await api.post(ENDPOINTS.AUTH.RESEND_OTP, {
        email: email.trim().toLowerCase(),
      });
      setMessage("A new OTP was sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 0,
                flex: 1,
                overflow: "hidden",
                padding: 26,
                shadowColor: "#064E3B",
                shadowOpacity: 0,
                shadowRadius: 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
                <Pressable onPress={() => router.back()} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontWeight: "900" }}>Back</Text>
                </Pressable>
                <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.INK} />
              </View>

              <View style={{ height: 150, justifyContent: "center" }}>
                <View
                  style={{
                    backgroundColor: "#8BCDC1",
                    height: 74,
                    position: "absolute",
                    right: -30,
                    top: 30,
                    transform: [{ rotate: "-10deg" }],
                    width: "92%",
                  }}
                />
                <View
                  style={{
                    alignItems: "center",
                    alignSelf: "center",
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.SURFACE,
                    borderRadius: 46,
                    borderWidth: 6,
                    height: 92,
                    justifyContent: "center",
                    width: 92,
                  }}
                >
                  <Ionicons name="mail-unread-outline" size={44} color={COLORS.PRIMARY_DARK} />
                </View>
              </View>

              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>
                Verify your email
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
                Enter the OTP sent to your inbox before continuing to your role workspace.
              </Text>

              <View style={{ gap: 12, marginTop: 22 }}>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Email"
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
                  maxLength={6}
                  onChangeText={setOtp}
                  placeholder="OTP code"
                  placeholderTextColor={COLORS.STEEL}
                  style={{
                    backgroundColor: "#FAD08A",
                    borderRadius: 10,
                    color: COLORS.INK,
                    fontSize: 18,
                    fontWeight: "900",
                    letterSpacing: 7,
                    padding: 14,
                    textAlign: "center",
                  }}
                  value={otp}
                />
                {message ? (
                  <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "800" }}>
                    {message}
                  </Text>
                ) : null}
                {error ? (
                  <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800" }}>
                    {error}
                  </Text>
                ) : null}
                <Pressable
                  disabled={loading}
                  onPress={verify}
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 10,
                    marginTop: 8,
                    opacity: loading ? 0.7 : 1,
                    paddingVertical: 16,
                  }}
                >
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </Text>
                </Pressable>
                <Pressable onPress={resend} style={{ alignItems: "center", paddingVertical: 8 }}>
                  <Text style={{ color: COLORS.PRIMARY, fontWeight: "900" }}>Resend Code</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
