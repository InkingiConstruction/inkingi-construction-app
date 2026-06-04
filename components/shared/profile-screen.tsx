import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useAuthStore, UserRole } from "@/store/auth.store";

type ProfileRoute =
  | "/(client)"
  | "/(client)/assign-engineer"
  | "/(client)/assign-supervisor"
  | "/(client)/disputes"
  | "/(client)/messages"
  | "/(client)/milestones"
  | "/(client)/notifications"
  | "/(client)/payments"
  | "/(client)/profile-edit"
  | "/(client)/projects"
  | "/(client)/settings"
  | "/(engineer)"
  | "/(engineer)/assignments"
  | "/(engineer)/boq"
  | "/(engineer)/messages"
  | "/(engineer)/milestones"
  | "/(engineer)/notifications"
  | "/(engineer)/profile-edit"
  | "/(engineer)/progress"
  | "/(engineer)/projects"
  | "/(engineer)/rfqs"
  | "/(engineer)/settings"
  | "/(supervisor)"
  | "/(supervisor)/inspections"
  | "/(supervisor)/messages"
  | "/(supervisor)/notifications"
  | "/(supervisor)/profile-edit"
  | "/(supervisor)/progress-review"
  | "/(supervisor)/projects"
  | "/(supervisor)/settings"
  | "/(supplier)"
  | "/(supplier)/deliveries"
  | "/(supplier)/messages"
  | "/(supplier)/notifications"
  | "/(supplier)/profile-edit"
  | "/(supplier)/purchase-orders"
  | "/(supplier)/quotes"
  | "/(supplier)/rfqs"
  | "/(supplier)/settings";

type ProfileAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  route: ProfileRoute;
};

const roleCopy: Record<UserRole, { title: string; body: string; icon: keyof typeof Ionicons.glyphMap }> = {
  admin: {
    title: "Admin Console",
    body: "Manage platform users, projects, and operational checks.",
    icon: "shield-checkmark-outline",
  },
  client: {
    title: "Client Workspace",
    body: "Track projects, approved milestones, payments, disputes, and team communication.",
    icon: "business-outline",
  },
  engineer: {
    title: "Engineer Workspace",
    body: "Manage milestones, BOQ, RFQs, and progress updates for accepted projects.",
    icon: "construct-outline",
  },
  supervisor: {
    title: "Supervisor Workspace",
    body: "Review progress, inspect work, and approve or reject engineering submissions.",
    icon: "shield-checkmark-outline",
  },
  supplier: {
    title: "Supplier Workspace",
    body: "Respond to RFQs, manage quotes, orders, and material deliveries.",
    icon: "cube-outline",
  },
};

const roleActions: Record<UserRole, ProfileAction[]> = {
  admin: [
    { icon: "home-outline", label: "Dashboard", route: "/(client)" },
    { icon: "settings-outline", label: "Settings", route: "/(client)/settings" },
  ],
  client: [
    { icon: "business-outline", label: "My projects", value: "Manage", route: "/(client)/projects" },
    { icon: "flag-outline", label: "Milestones", value: "Review", route: "/(client)/milestones" },
    { icon: "card-outline", label: "Payments", value: "Escrow", route: "/(client)/payments" },
    { icon: "alert-circle-outline", label: "Disputes", value: "Cases", route: "/(client)/disputes" },
    { icon: "chatbubbles-outline", label: "Messages", value: "Project chat", route: "/(client)/messages" },
  ],
  engineer: [
    { icon: "mail-unread-outline", label: "Assignments", value: "Invites", route: "/(engineer)/assignments" },
    { icon: "business-outline", label: "Projects", value: "Workspaces", route: "/(engineer)/projects" },
    { icon: "flag-outline", label: "Milestones", value: "Plan", route: "/(engineer)/milestones" },
    { icon: "list-outline", label: "BOQ", value: "Items", route: "/(engineer)/boq" },
    { icon: "receipt-outline", label: "RFQs", value: "Suppliers", route: "/(engineer)/rfqs" },
    { icon: "camera-outline", label: "Progress", value: "Uploads", route: "/(engineer)/progress" },
  ],
  supervisor: [
    { icon: "business-outline", label: "Projects", value: "Assigned", route: "/(supervisor)/projects" },
    { icon: "camera-outline", label: "Progress review", value: "Approve", route: "/(supervisor)/progress-review" },
    { icon: "clipboard-outline", label: "Inspections", value: "Site checks", route: "/(supervisor)/inspections" },
    { icon: "chatbubbles-outline", label: "Messages", value: "Project chat", route: "/(supervisor)/messages" },
  ],
  supplier: [
    { icon: "receipt-outline", label: "RFQs", value: "Open", route: "/(supplier)/rfqs" },
    { icon: "document-text-outline", label: "Quotes", value: "Submitted", route: "/(supplier)/quotes" },
    { icon: "cart-outline", label: "Orders", value: "Purchase", route: "/(supplier)/purchase-orders" },
    { icon: "cube-outline", label: "Deliveries", value: "Track", route: "/(supplier)/deliveries" },
    { icon: "chatbubbles-outline", label: "Messages", value: "Project chat", route: "/(supplier)/messages" },
  ],
};

const roleHome: Record<UserRole, ProfileRoute> = {
  admin: "/(client)",
  client: "/(client)",
  engineer: "/(engineer)",
  supervisor: "/(supervisor)",
  supplier: "/(supplier)",
};

const roleSettings: Record<UserRole, ProfileRoute> = {
  admin: "/(client)/settings",
  client: "/(client)/settings",
  engineer: "/(engineer)/settings",
  supervisor: "/(supervisor)/settings",
  supplier: "/(supplier)/settings",
};

const roleNotifications: Record<UserRole, ProfileRoute> = {
  admin: "/(client)/notifications",
  client: "/(client)/notifications",
  engineer: "/(engineer)/notifications",
  supervisor: "/(supervisor)/notifications",
  supplier: "/(supplier)/notifications",
};

const roleProfileEdit: Record<UserRole, ProfileRoute> = {
  admin: "/(client)/profile-edit",
  client: "/(client)/profile-edit",
  engineer: "/(engineer)/profile-edit",
  supervisor: "/(supervisor)/profile-edit",
  supplier: "/(supplier)/profile-edit",
};

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const loading = useAuthStore((state) => state.loading);
  const role = (user?.role || "client") as UserRole;
  const imageUri = user?.image || user?.avatar || "";
  const roleInfo = roleCopy[role] || roleCopy.client;
  const actions = roleActions[role] || roleActions.client;

  const completion = useMemo(() => {
    let score = 20;
    if (user?.name) score += 10;
    if (user?.emailVerified) score += 20;
    if (user?.phoneNumber || user?.phone) score += 15;
    if (user?.username || user?.displayUsername) score += 15;
    if (user?.image || user?.avatar) score += 10;
    if (user?.kycStatus === "approved") score += 10;
    return Math.min(score, 100);
  }, [user]);

  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();
  const kycText = (user?.kycStatus || "not_submitted").replace(/_/g, " ");
  const phone = user?.phoneNumber || user?.phone || "Not set";

  const go = (route: ProfileRoute) => router.push(route as never);

  const handleLogout = () => {
    Alert.alert("Log out", "Do you want to leave your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUser} tintColor={COLORS.PRIMARY} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>{role.toUpperCase()} ACCOUNT</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <Pressable onPress={() => go(roleNotifications[role])} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Pressable onPress={() => go(roleSettings[role])} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name || "Account user"}</Text>
              <Text style={styles.email}>{user?.email || "No email"}</Text>
              <View style={styles.pillRow}>
                <StatusPill
                  icon={user?.emailVerified ? "checkmark-circle" : "time-outline"}
                  label={user?.emailVerified ? "Email verified" : "Email pending"}
                  tone={user?.emailVerified ? "success" : "warning"}
                />
                <StatusPill icon="id-card-outline" label={role.toUpperCase()} tone="neutral" />
              </View>
            </View>
          </View>

          <View style={styles.rolePanel}>
            <View style={styles.roleIcon}>
              <Ionicons name={roleInfo.icon} size={22} color={COLORS.PRIMARY_DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>{roleInfo.title}</Text>
              <Text style={styles.roleBody}>{roleInfo.body}</Text>
            </View>
          </View>
        </View>

        <View style={styles.completionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Account readiness</Text>
            <Text style={styles.cardBody}>
              {completion >= 90 ? "Your profile is ready for production workflows." : "Complete your profile details to keep workflows smooth."}
            </Text>
            {user?.kycRejectionReason ? (
              <Text style={styles.rejectionText}>KYC note: {user.kycRejectionReason}</Text>
            ) : null}
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{completion}%</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickButton icon="create-outline" label="Edit profile" onPress={() => go(roleProfileEdit[role])} />
          <QuickButton icon="home-outline" label="Dashboard" onPress={() => go(roleHome[role])} />
        </View>

        <Group title="Workspace">
          {actions.map((action) => (
            <MenuRow
              key={`${action.label}-${action.route}`}
              icon={action.icon}
              label={action.label}
              value={action.value}
              onPress={() => go(action.route)}
            />
          ))}
        </Group>

        <Group title="Account Details">
          <MenuRow icon="person-outline" label="Full name" value={user?.name || "Not set"} onPress={() => go(roleProfileEdit[role])} />
          <MenuRow icon="at-outline" label="Username" value={user?.username || user?.displayUsername || "Not set"} onPress={() => go(roleProfileEdit[role])} />
          <MenuRow icon="call-outline" label="Phone number" value={phone} onPress={() => go(roleProfileEdit[role])} />
          <MenuRow icon="mail-outline" label="Email" value={user?.email || "No email"} />
        </Group>

        <Group title="Verification">
          <MenuRow
            icon={user?.emailVerified ? "checkmark-circle-outline" : "time-outline"}
            label="Email status"
            value={user?.emailVerified ? "Verified" : "Pending"}
          />
          <MenuRow
            icon={user?.phoneNumberVerified ? "checkmark-circle-outline" : "time-outline"}
            label="Phone status"
            value={user?.phoneNumberVerified ? "Verified" : "Pending"}
          />
          <MenuRow icon="document-text-outline" label="KYC status" value={kycText} />
          <MenuRow icon="document-attach-outline" label="Documents" value={`${user?.registrationDocuments?.length || 0}`} onPress={() => go(roleProfileEdit[role])} />
        </Group>

        <Group title="Preferences">
          <MenuRow icon="notifications-outline" label="Notifications" value="Manage" onPress={() => go(roleNotifications[role])} />
          <MenuRow icon="settings-outline" label="Settings" value="Open" onPress={() => go(roleSettings[role])} />
          <MenuRow icon="language-outline" label="Language" value="English" />
        </Group>

        <View style={styles.footer}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={19} color={COLORS.ERROR} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPill({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const color = tone === "success" ? COLORS.SUCCESS : tone === "warning" ? COLORS.GOLD : COLORS.PRIMARY_LIGHT;
  return (
    <View style={styles.statusPill}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

function QuickButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickButton}>
      <Ionicons name={icon} size={18} color={COLORS.TEXT_WHITE} />
      <Text style={styles.quickButtonText}>{label}</Text>
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={COLORS.PRIMARY_DARK} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text numberOfLines={1} style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_LIGHT} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.row}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.BACKGROUND,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  headerEyebrow: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: "900",
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 26,
    fontWeight: "900",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  hero: {
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    gap: 16,
    marginBottom: 14,
    overflow: "hidden",
    padding: 18,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    justifyContent: "center",
    overflow: "hidden",
    width: 68,
  },
  avatar: {
    height: 68,
    width: 68,
  },
  avatarText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 24,
    fontWeight: "900",
  },
  name: {
    color: COLORS.TEXT_WHITE,
    fontSize: 22,
    fontWeight: "900",
  },
  email: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusPillText: {
    color: COLORS.TEXT_WHITE,
    fontSize: 10,
    fontWeight: "900",
  },
  rolePanel: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 13,
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  roleTitle: {
    color: COLORS.TEXT_WHITE,
    fontSize: 15,
    fontWeight: "900",
  },
  roleBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  completionCard: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "900",
  },
  cardBody: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  rejectionText: {
    color: COLORS.ERROR,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 8,
  },
  scoreCircle: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
    borderRadius: 38,
    borderRightColor: COLORS.GOLD,
    borderWidth: 5,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  scoreText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 20,
    fontWeight: "900",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  quickButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 13,
  },
  quickButtonText: {
    color: COLORS.TEXT_WHITE,
    fontWeight: "900",
  },
  group: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    paddingVertical: 8,
  },
  groupTitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 7,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  rowLabel: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontWeight: "800",
  },
  rowValue: {
    color: COLORS.TEXT_SECONDARY,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 150,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: "rgba(220, 38, 38, 0.20)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logoutText: {
    color: COLORS.ERROR,
    fontWeight: "900",
  },
  versionText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
});
