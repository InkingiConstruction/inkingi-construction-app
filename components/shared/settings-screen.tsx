import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { useAuthStore, User, UserRole } from "@/store/auth.store";

type SettingsRoute =
  | "/(client)"
  | "/(client)/messages"
  | "/(client)/milestones"
  | "/(client)/notifications"
  | "/(client)/payments"
  | "/(client)/profile-edit"
  | "/(client)/projects"
  | "/(engineer)"
  | "/(engineer)/assignments"
  | "/(engineer)/boq"
  | "/(engineer)/messages"
  | "/(engineer)/notifications"
  | "/(engineer)/profile-edit"
  | "/(engineer)/projects"
  | "/(supervisor)"
  | "/(supervisor)/inspections"
  | "/(supervisor)/messages"
  | "/(supervisor)/notifications"
  | "/(supervisor)/profile-edit"
  | "/(supervisor)/progress-review"
  | "/(supplier)"
  | "/(supplier)/deliveries"
  | "/(supplier)/messages"
  | "/(supplier)/notifications"
  | "/(supplier)/profile-edit"
  | "/(supplier)/purchase-orders"
  | "/(supplier)/quotes"
  | "/(supplier)/rfqs";

type Shortcut = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: SettingsRoute;
};

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "fr", name: "Français" },
] as const;

const roleHome: Record<UserRole, SettingsRoute> = {
  admin: "/(client)",
  client: "/(client)",
  engineer: "/(engineer)",
  supervisor: "/(supervisor)",
  supplier: "/(supplier)",
};

const roleProfileEdit: Record<UserRole, SettingsRoute> = {
  admin: "/(client)/profile-edit",
  client: "/(client)/profile-edit",
  engineer: "/(engineer)/profile-edit",
  supervisor: "/(supervisor)/profile-edit",
  supplier: "/(supplier)/profile-edit",
};

const roleNotifications: Record<UserRole, SettingsRoute> = {
  admin: "/(client)/notifications",
  client: "/(client)/notifications",
  engineer: "/(engineer)/notifications",
  supervisor: "/(supervisor)/notifications",
  supplier: "/(supplier)/notifications",
};

const roleShortcuts: Record<UserRole, Shortcut[]> = {
  admin: [
    { icon: "business-outline", label: "Dashboard", route: "/(client)" },
    { icon: "chatbubbles-outline", label: "Messages", route: "/(client)/messages" },
  ],
  client: [
    { icon: "business-outline", label: "Projects", route: "/(client)/projects" },
    { icon: "flag-outline", label: "Milestones", route: "/(client)/milestones" },
    { icon: "card-outline", label: "Payments", route: "/(client)/payments" },
    { icon: "chatbubbles-outline", label: "Messages", route: "/(client)/messages" },
  ],
  engineer: [
    { icon: "mail-unread-outline", label: "Assignments", route: "/(engineer)/assignments" },
    { icon: "business-outline", label: "Projects", route: "/(engineer)/projects" },
    { icon: "list-outline", label: "BOQ", route: "/(engineer)/boq" },
    { icon: "chatbubbles-outline", label: "Messages", route: "/(engineer)/messages" },
  ],
  supervisor: [
    { icon: "camera-outline", label: "Progress Review", route: "/(supervisor)/progress-review" },
    { icon: "clipboard-outline", label: "Inspections", route: "/(supervisor)/inspections" },
    { icon: "chatbubbles-outline", label: "Messages", route: "/(supervisor)/messages" },
  ],
  supplier: [
    { icon: "receipt-outline", label: "RFQs", route: "/(supplier)/rfqs" },
    { icon: "document-text-outline", label: "Quotes", route: "/(supplier)/quotes" },
    { icon: "cart-outline", label: "Orders", route: "/(supplier)/purchase-orders" },
    { icon: "cube-outline", label: "Deliveries", route: "/(supplier)/deliveries" },
  ],
};

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const loading = useAuthStore((state) => state.loading);
  const role = (user?.role || "client") as UserRole;
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false });
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]["code"]>("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs({
      push: user?.notificationPrefs?.push ?? true,
      email: user?.notificationPrefs?.email ?? true,
      sms: user?.notificationPrefs?.sms ?? false,
    });
  }, [user]);

  const go = (route: SettingsRoute) => router.push(route as never);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.patch<{ user: User }>(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        notificationPrefs: prefs,
      });
      useAuthStore.setState({ user: response.data.user, isAuthenticated: true });
      Alert.alert("Settings saved", "Your preferences were updated.");
    } catch {
      Alert.alert("Save failed", "Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={styles.eyebrow}>{role.toUpperCase()} SETTINGS</Text>
            <Text style={styles.title}>Settings</Text>
          </View>
          <Pressable onPress={() => go(roleNotifications[role])} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="settings-outline" size={26} color={COLORS.TEXT_WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>App preferences</Text>
            <Text style={styles.heroBody}>
              Manage notifications, language, account access, and shortcuts for your role.
            </Text>
          </View>
        </View>

        <Group title="Account">
          <MenuRow icon="person-outline" label={user?.name || "Account user"} value={user?.email || "No email"} onPress={() => go(roleProfileEdit[role])} />
          <MenuRow icon="id-card-outline" label="Role" value={role} />
          <MenuRow icon="create-outline" label="Edit profile" value="Open" onPress={() => go(roleProfileEdit[role])} />
        </Group>

        <Group title="Workspace Shortcuts">
          <MenuRow icon="home-outline" label="Dashboard" value="Home" onPress={() => go(roleHome[role])} />
          {roleShortcuts[role].map((shortcut) => (
            <MenuRow
              key={`${shortcut.label}-${shortcut.route}`}
              icon={shortcut.icon}
              label={shortcut.label}
              value="Open"
              onPress={() => go(shortcut.route)}
            />
          ))}
        </Group>

        <Group title="Notifications">
          <ToggleRow
            icon="notifications-outline"
            title="Push notifications"
            description="Project invitations, approvals, chat, and delivery updates."
            value={prefs.push}
            onValueChange={(value) => setPrefs((state) => ({ ...state, push: value }))}
          />
          <Divider />
          <ToggleRow
            icon="mail-outline"
            title="Email notifications"
            description="Verification, account, and workflow messages."
            value={prefs.email}
            onValueChange={(value) => setPrefs((state) => ({ ...state, email: value }))}
          />
          <Divider />
          <ToggleRow
            icon="chatbox-ellipses-outline"
            title="SMS notifications"
            description="Phone alerts when supported by the platform."
            value={prefs.sms}
            onValueChange={(value) => setPrefs((state) => ({ ...state, sms: value }))}
          />
        </Group>

        <Group title="Language">
          {LANGUAGES.map((item, index) => (
            <View key={item.code}>
              <Pressable onPress={() => setLanguage(item.code)} style={styles.languageRow}>
                <View style={styles.rowIcon}>
                  <Ionicons name="language-outline" size={16} color={COLORS.PRIMARY_DARK} />
                </View>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <View style={[styles.radio, language === item.code && styles.radioActive]}>
                  {language === item.code ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
              {index < LANGUAGES.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Group>

        <Group title="Support">
          <MenuRow icon="headset-outline" label="Help Center" value="Support" />
          <MenuRow icon="information-circle-outline" label="App version" value="1.0.0" />
        </Group>

        <Pressable disabled={saving} onPress={saveSettings} style={[styles.saveButton, saving && { opacity: 0.7 }]}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save settings"}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={19} color={COLORS.ERROR} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
          <Text style={styles.versionText}>Inkingi 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
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
      <Text numberOfLines={1} style={styles.rowLabel}>{label}</Text>
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

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={20} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.CONCRETE, true: COLORS.PRIMARY_LIGHT }}
        thumbColor={value ? COLORS.PRIMARY : COLORS.TEXT_LIGHT}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
    gap: 10,
    marginBottom: 16,
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
  eyebrow: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 11,
    fontWeight: "900",
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 27,
    fontWeight: "900",
  },
  hero: {
    alignItems: "center",
    backgroundColor: COLORS.INK,
    borderRadius: 12,
    flexDirection: "row",
    gap: 13,
    marginBottom: 14,
    padding: 18,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 13,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  heroTitle: {
    color: COLORS.TEXT_WHITE,
    fontSize: 21,
    fontWeight: "900",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
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
    maxWidth: 132,
    textTransform: "capitalize",
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  toggleIcon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  toggleTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "900",
  },
  toggleDescription: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  languageRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  radio: {
    alignItems: "center",
    borderColor: COLORS.TEXT_LIGHT,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioActive: {
    borderColor: COLORS.PRIMARY,
  },
  radioDot: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  divider: {
    backgroundColor: COLORS.BORDER_LIGHT,
    height: 1,
    marginHorizontal: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    marginTop: 2,
    paddingVertical: 14,
  },
  saveText: {
    color: COLORS.TEXT_WHITE,
    fontSize: 15,
    fontWeight: "900",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
