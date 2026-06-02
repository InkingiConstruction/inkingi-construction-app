import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
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
import { getPostAuthRoute, useAuthStore } from "@/store/auth.store";

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
      const user = useAuthStore.getState().user;
      router.replace(getPostAuthRoute(user) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 0,
                flex: 1,
                justifyContent: "center",
                padding: 28,
                shadowColor: "#064E3B",
                shadowOpacity: 0,
                shadowRadius: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.INK,
                  borderBottomRightRadius: 18,
                  borderTopRightRadius: 18,
                  height: 28,
                  marginBottom: 72,
                  width: 16,
                }}
              />

              <View style={{ gap: 8, marginBottom: 26 }}>
                <Text
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                    fontSize: 30,
                    fontWeight: "900",
                  }}
                >
                  Hey,
                  {"\n"}Login Now.
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>
                  If you are new /{" "}
                  <Link href="/(auth)/register" asChild>
                    <Text style={{ color: COLORS.INK, fontWeight: "900" }}>
                      Create New
                    </Text>
                  </Link>
                </Text>
              </View>

              <View style={{ gap: 14 }}>
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "#FAD08A",
                    borderRadius: 10,
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                >
                  <Ionicons name="mail-outline" size={18} color={COLORS.INK} />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="Email address"
                    placeholderTextColor={COLORS.STEEL}
                    style={{ color: COLORS.INK, flex: 1, fontWeight: "700" }}
                    value={email}
                  />
                </View>
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.MUTED,
                    borderRadius: 10,
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.TEXT_LIGHT}
                  />
                  <TextInput
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={COLORS.TEXT_LIGHT}
                    secureTextEntry
                    style={{ color: COLORS.TEXT_PRIMARY, flex: 1 }}
                    value={password}
                  />
                </View>

                {error ? (
                  <Text
                    style={{
                      color: COLORS.ERROR,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                  Forgot passcode? /{" "}
                  <Link href="/(auth)/forgot-password" asChild>
                    <Text style={{ color: COLORS.INK, fontWeight: "900" }}>
                      Reset
                    </Text>
                  </Link>
                </Text>

                <Pressable
                  disabled={loading}
                  onPress={submit}
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 10,
                    marginTop: 34,
                    opacity: loading ? 0.7 : 1,
                    paddingVertical: 16,
                  }}
                >
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                    {loading ? "Signing in..." : "Login"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
