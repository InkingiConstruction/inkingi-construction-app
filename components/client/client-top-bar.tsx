import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";

type ClientTopBarProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
};

export function ClientTopBar({ title, subtitle, back = false }: ClientTopBarProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={{ gap: 14, marginBottom: 18 }}>
      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
          {back && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginRight: 12,
                padding: 6,
                borderRadius: 8,
                backgroundColor: COLORS.SURFACE,
                borderWidth: 1,
                borderColor: COLORS.BORDER_LIGHT,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_PRIMARY} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>
              {back ? "BACK TO WORKSPACE" : "WORKSPACE"}
            </Text>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 26, fontWeight: "900" }}>
              {title}
            </Text>
          </View>
        </View>
        {!back && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TopButton icon="notifications-outline" onPress={() => router.push("/(client)/notifications")} />
            <TopButton icon="settings-outline" onPress={() => router.push("/(client)/settings")} />
          </View>
        )}
      </View>

      {subtitle ? (
        <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}

      {!back && (
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
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            <Ionicons name="business-outline" size={22} color={COLORS.PRIMARY_DARK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
              {user?.name || "Client"}
            </Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 3 }}>
              Create projects, assign teams, review progress, and release payments.
            </Text>
          </View>
        </View>
      )}
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
