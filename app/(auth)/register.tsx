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
import { useAuthStore } from "@/store/auth.store";

const roles = [
  { label: "Client", value: "client", icon: "home-outline" as const },
  { label: "Engineer", value: "engineer", icon: "construct-outline" as const },
  { label: "Supervisor", value: "supervisor", icon: "shield-checkmark-outline" as const },
  { label: "Supplier", value: "supplier", icon: "cube-outline" as const },
];

export default function Register() {
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      await register(name.trim(), cleanEmail, password, role);
      router.push({ pathname: "/(auth)/verify-email", params: { email: cleanEmail } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
                padding: 26,
                shadowColor: "#064E3B",
                shadowOpacity: 0,
                shadowRadius: 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View
                  style={{
                    backgroundColor: COLORS.INK,
                    borderBottomRightRadius: 18,
                    borderTopRightRadius: 18,
                    height: 28,
                    width: 16,
                  }}
                />
                <Ionicons name="person-add-outline" size={22} color={COLORS.INK} />
              </View>

              <View style={{ gap: 8, marginBottom: 20, marginTop: 42 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 30, fontWeight: "900" }}>
                  Create
                  {"\n"}your account.
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>
                  Already registered? /{" "}
                  <Link href="/(auth)/login" asChild>
                    <Text style={{ color: COLORS.INK, fontWeight: "900" }}>Login</Text>
                  </Link>
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {roles.map((item) => {
                  const selected = role === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setRole(item.value)}
                      style={{
                        alignItems: "center",
                        backgroundColor: selected ? COLORS.PRIMARY : COLORS.MUTED,
                        borderRadius: 14,
                        flexDirection: "row",
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={selected ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY}
                      />
                      <Text
                        style={{
                          color: selected ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY,
                          fontSize: 12,
                          fontWeight: "900",
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ gap: 12 }}>
                {[
                  { value: name, setter: setName, placeholder: "Full name", icon: "person-outline" as const },
                  { value: email, setter: setEmail, placeholder: "Email address", icon: "mail-outline" as const },
                ].map((field) => (
                  <View
                    key={field.placeholder}
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
                    <Ionicons name={field.icon} size={18} color={COLORS.TEXT_LIGHT} />
                    <TextInput
                      autoCapitalize={field.placeholder.includes("Email") ? "none" : "words"}
                      keyboardType={field.placeholder.includes("Email") ? "email-address" : "default"}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.TEXT_LIGHT}
                      style={{ color: COLORS.TEXT_PRIMARY, flex: 1 }}
                      value={field.value}
                    />
                  </View>
                ))}
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
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.INK} />
                  <TextInput
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={COLORS.STEEL}
                    secureTextEntry
                    style={{ color: COLORS.INK, flex: 1, fontWeight: "700" }}
                    value={password}
                  />
                </View>
              </View>

              {error ? (
                <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "700", marginTop: 10 }}>
                  {error}
                </Text>
              ) : null}

              <Pressable
                disabled={loading}
                onPress={submit}
                style={{
                  alignItems: "center",
                  backgroundColor: "#8BCDC1",
                  borderRadius: 10,
                  marginTop: 24,
                  opacity: loading ? 0.7 : 1,
                  paddingVertical: 16,
                }}
              >
                <Text style={{ color: COLORS.INK, fontWeight: "900" }}>
                  {loading ? "Creating..." : "Create Account"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
