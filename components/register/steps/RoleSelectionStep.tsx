import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { UserRole } from "@/app/(auth)/register";
import { COLORS } from "@/constants/colors";
import { createStyles } from "@/utils/createStyles";

interface RoleConfig {
  id: UserRole;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  accent: string;
  tint: string;
}

const ROLES: RoleConfig[] = [
  {
    id: "client",
    title: "Client",
    icon: "home-outline",
    description: "Create a project, assign professionals, and follow site progress.",
    accent: COLORS.PRIMARY,
    tint: COLORS.PRIMARY_LIGHT,
  },
  {
    id: "engineer",
    title: "Engineer",
    icon: "construct-outline",
    description: "Manage milestones, BOQs, procurement requests, and updates.",
    accent: COLORS.INFO,
    tint: "#DBEAFE",
  },
  {
    id: "supervisor",
    title: "Supervisor",
    icon: "shield-checkmark-outline",
    description: "Review assigned work, approve progress, and record inspection decisions.",
    accent: COLORS.GOLD,
    tint: "#FEF3C7",
  },
  {
    id: "supplier",
    title: "Supplier",
    icon: "cube-outline",
    description: "Receive RFQs, submit quotes, and coordinate material delivery.",
    accent: COLORS.STEEL,
    tint: COLORS.MUTED,
  },
];

interface RoleSelectionStepProps {
  onSelect: (role: UserRole) => void;
}

export default function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  const handleSelect = (role: UserRole) => {
    onSelect(role);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Ionicons name="business-outline" size={22} color={COLORS.TEXT_WHITE} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>INKINGI CONSTRUCTION</Text>
            <Text style={styles.heading}>Choose your workspace</Text>
            <Text style={styles.subheading}>
              Pick the role that matches how you will use the platform.
            </Text>
          </View>
        </View>

        <View style={styles.roleList}>
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              onPress={() => handleSelect(role.id)}
              style={({ pressed }) => [
                styles.card,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: role.tint }]}>
                <Ionicons name={role.icon} size={22} color={role.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDesc}>{role.description}</Text>
              </View>
              <View style={styles.actionIcon}>
                <Ionicons name="arrow-forward" size={17} color={COLORS.PRIMARY_DARK} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Already registered?</Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  safe: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
  },
  header: {
    backgroundColor: COLORS.PRIMARY_DARK,
    borderRadius: 8,
    marginBottom: 18,
    overflow: "hidden",
    padding: 18,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    marginBottom: 42,
    width: 44,
  },
  headerText: {
    gap: 6,
  },
  kicker: {
    color: COLORS.GOLD,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heading: {
    color: COLORS.TEXT_WHITE,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  subheading: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    maxWidth: 300,
  },
  roleList: {
    gap: 10,
  },
  card: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 14,
  },
  cardPressed: {
    borderColor: COLORS.PRIMARY,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "900",
  },
  cardDesc: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  loginRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 22,
  },
  loginLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "700",
  },
  loginLink: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: "900",
  },
});
