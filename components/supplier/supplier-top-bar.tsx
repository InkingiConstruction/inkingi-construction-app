import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";

export function SupplierTopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={{ gap: 14, marginBottom: 18 }}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
            SUPPLIER PORTAL
          </Text>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TopButton icon="notifications-outline" onPress={() => router.push("/(supplier)/notifications")} />
          <TopButton icon="person-circle-outline" onPress={() => router.push("/(supplier)/profile")} />
          <TopButton icon="settings-outline" onPress={() => router.push("/(supplier)/settings")} />
        </View>
      </View>
      <View
        style={{
          backgroundColor: COLORS.SURFACE,
          borderColor: COLORS.BORDER_LIGHT,
          borderRadius: 10,
          borderWidth: 1,
          flexDirection: "row",
          gap: 12,
          padding: 14,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY_LIGHT,
            borderRadius: 8,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          <Ionicons name="cube-outline" size={22} color={COLORS.PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
            {user?.name || "Supplier"}
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>
            Quote RFQs, accept orders, and update delivery status.
          </Text>
        </View>
      </View>
    </View>
  );
}

function TopButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: COLORS.SURFACE,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 8,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        width: 42,
      }}
    >
      <Ionicons name={icon} size={21} color={COLORS.TEXT_PRIMARY} />
    </Pressable>
  );
}
