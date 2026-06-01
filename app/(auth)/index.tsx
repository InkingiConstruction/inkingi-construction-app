import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

export default function AuthIndex() {
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
              borderRadius: 26,
              height: 96,
              justifyContent: "center",
              width: 96,
            }}
          >
            <Ionicons name="business-outline" size={48} color={COLORS.PRIMARY_DARK} />
          </View>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 31, fontWeight: "900", marginTop: 28 }}>
            Account
            {"\n"}Access.
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            Login, create your role account, verify email, and continue to KYC.
          </Text>
          <View style={{ gap: 12, marginTop: 28 }}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={{ backgroundColor: "#8BCDC1", borderRadius: 12, paddingVertical: 16, alignItems: "center" }}>
                <Text style={{ color: COLORS.INK, fontWeight: "900" }}>Login</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/register" asChild>
              <Pressable style={{ backgroundColor: COLORS.MUTED, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>Create Account</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/forgot-password" asChild>
              <Text style={{ color: COLORS.PRIMARY, fontWeight: "900", textAlign: "center" }}>
                Forgot password
              </Text>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
