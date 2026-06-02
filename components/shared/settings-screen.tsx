import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { useAuthStore, User } from "@/store/auth.store";
import { useSampleFlowStore } from "@/store/sampleFlow.store";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

// Mock documents list
const MOCK_DOCS = [
  { id: "d1", name: "National ID (Indangamuntu)", status: "verified", icon: "card-outline" as const, date: "2024-01-10" },
  { id: "d2", name: "Construction Permit", status: "pending", icon: "document-text-outline" as const, date: "2024-03-22" },
  { id: "d3", name: "Land Certificate (Icyangobwa)", status: "verified", icon: "ribbon-outline" as const, date: "2024-02-05" },
];

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  const bankAccounts = useSampleFlowStore((s) => s.bankAccounts);
  const transactions = useSampleFlowStore((s) => s.transactions);

  // Profile fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Settings
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false });
  const [language, setLanguage] = useState<"en" | "rw" | "fr">("en");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setUsername(user?.username || user?.displayUsername || "");
    setPhoneNumber(user?.phoneNumber || user?.phone || "");
    setPrefs({
      push: user?.notificationPrefs?.push ?? true,
      email: user?.notificationPrefs?.email ?? true,
      sms: user?.notificationPrefs?.sms ?? false,
    });
  }, [user]);

  const completion = useMemo(() => {
    let score = 20;
    if (user?.emailVerified) score += 20;
    if (user?.phoneNumber || user?.phone) score += 20;
    if (user?.username || user?.displayUsername) score += 15;
    if (user?.kycStatus === "approved") score += 25;
    return Math.min(score, 100);
  }, [user]);

  const totalEscrow = useMemo(() => {
    return transactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        displayUsername: username.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      const response = await api.patch<{ user: User }>(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        notificationPrefs: prefs,
      });
      useAuthStore.setState({ user: response.data.user, isAuthenticated: true });
      setMessage("Settings saved successfully.");
    } catch {
      setError("Failed to save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 22, fontWeight: "900", flex: 1 }}>
              Settings
            </Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>v1.0.0</Text>
          </View>

          {/* ── VERIFICATION CARD (yellow) ── */}
          <View
            style={{
              backgroundColor: "#B9F000",
              borderRadius: 16,
              flexDirection: "row",
              marginBottom: 20,
              minHeight: 112,
              overflow: "hidden",
              padding: 16,
            }}
          >
            {/* Avatar */}
            <View style={{ justifyContent: "center", marginRight: 14 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(15,23,42,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {user?.avatar || user?.image ? (
                  <Image
                    source={{ uri: user.avatar || user.image || "" }}
                    style={{ width: 56, height: 56 }}
                  />
                ) : (
                  <Text style={{ color: COLORS.INK, fontSize: 22, fontWeight: "900" }}>
                    {initials}
                  </Text>
                )}
              </View>
            </View>

            {/* Info */}
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: COLORS.INK, fontSize: 16, fontWeight: "900" }}>
                {user?.name || "Account User"}
              </Text>
              <Text style={{ color: COLORS.INK, fontSize: 12, marginTop: 2 }}>
                {user?.email}
              </Text>
              <View
                style={{
                  marginTop: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(15,23,42,0.12)",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: COLORS.INK, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
                    {user?.role || "Client"}
                  </Text>
                </View>
                <Text style={{ color: COLORS.INK, fontSize: 11 }}>
                  {user?.kycStatus === "approved" ? "✓ Verified" : `KYC: ${user?.kycStatus || "pending"}`}
                </Text>
              </View>
            </View>

            {/* Completion ring */}
            <View style={{ alignItems: "center", justifyContent: "center", width: 76 }}>
              <View
                style={{
                  alignItems: "center",
                  borderColor: COLORS.INK,
                  borderRadius: 38,
                  borderRightColor: "rgba(15,23,42,0.18)",
                  borderWidth: 5,
                  height: 72,
                  justifyContent: "center",
                  width: 72,
                }}
              >
                <Text style={{ color: COLORS.INK, fontSize: 18, fontWeight: "900" }}>
                  {completion}%
                </Text>
                <Text style={{ color: COLORS.INK, fontSize: 8, fontWeight: "700" }}>PROFILE</Text>
              </View>
            </View>
          </View>

          {/* ── ACCOUNT / PROFILE EDITING ── */}
          <SectionHeader title="ACCOUNT" />
          <View style={groupStyle}>
            <FieldRow icon="person-outline">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                style={inputStyle}
              />
            </FieldRow>
            <Divider />
            <FieldRow icon="at-outline">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                style={inputStyle}
              />
            </FieldRow>
            <Divider />
            <FieldRow icon="call-outline">
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone number"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                keyboardType="phone-pad"
                style={inputStyle}
              />
            </FieldRow>
            <Divider />
            <InfoRow icon="shield-checkmark-outline" label="Role & verification" value={user?.role || "client"} />
          </View>

          {/* Feedback */}
          {message ? (
            <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "800", marginBottom: 8 }}>
              ✓ {message}
            </Text>
          ) : null}
          {error ? (
            <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginBottom: 8 }}>
              {error}
            </Text>
          ) : null}

          {/* ── FINANCIAL SUMMARY ── */}
          <SectionHeader title="FINANCIAL SUMMARY" />
          <View style={{ gap: 10, marginBottom: 20 }}>
            {/* Escrow balance */}
            <View
              style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.BORDER_LIGHT,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.PRIMARY_DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                  Total Escrow Deposited
                </Text>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900", marginTop: 2 }}>
                  {totalEscrow.toLocaleString()} RWF
                </Text>
              </View>
              <Ionicons name="trending-up-outline" size={20} color={COLORS.SUCCESS} />
            </View>

            {/* Linked accounts */}
            {bankAccounts.map((acc) => (
              <View
                key={acc.type}
                style={{
                  backgroundColor: COLORS.SURFACE,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.BORDER_LIGHT,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: acc.type === "bk" ? "#E8F4FD" : "#FFF3E0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{acc.type === "bk" ? "🏦" : "📱"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900" }}>
                    {acc.bankName}
                  </Text>
                  <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 1 }}>
                    {acc.accountNumber}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "900" }}>
                    {acc.balance.toLocaleString()} RWF
                  </Text>
                  <View
                    style={{
                      backgroundColor: acc.linked ? COLORS.PRIMARY_LIGHT : COLORS.MUTED,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: acc.linked ? COLORS.PRIMARY_DARK : COLORS.TEXT_SECONDARY,
                        fontSize: 9,
                        fontWeight: "900",
                        textTransform: "uppercase",
                      }}
                    >
                      {acc.linked ? "Linked" : "Unlinked"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── DOCUMENT MANAGEMENT ── */}
          <SectionHeader title="MY DOCUMENTS" />
          <View style={groupStyle}>
            {MOCK_DOCS.map((doc, i) => (
              <View key={doc.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: doc.status === "verified" ? COLORS.PRIMARY_LIGHT : "#FFF8E1",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={doc.icon}
                      size={18}
                      color={doc.status === "verified" ? COLORS.PRIMARY_DARK : "#F59E0B"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "800" }}>
                      {doc.name}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 1 }}>
                      Uploaded {doc.date}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: doc.status === "verified" ? COLORS.PRIMARY_LIGHT : "#FEF3C7",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: doc.status === "verified" ? COLORS.PRIMARY_DARK : "#92400E",
                        fontSize: 10,
                        fontWeight: "900",
                        textTransform: "uppercase",
                      }}
                    >
                      {doc.status}
                    </Text>
                  </View>
                </View>
                {i < MOCK_DOCS.length - 1 && <Divider />}
              </View>
            ))}
            <Divider />
            <Pressable
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: COLORS.PRIMARY,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.PRIMARY} />
              </View>
              <Text style={{ color: COLORS.PRIMARY, fontSize: 13, fontWeight: "900", flex: 1 }}>
                Upload New Document
              </Text>
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.PRIMARY} />
            </Pressable>
          </View>

          {/* ── NOTIFICATIONS ── */}
          <SectionHeader title="NOTIFICATIONS" />
          <View style={groupStyle}>
            <NotifRow
              icon="notifications-outline"
              title="Push notifications"
              description="Project updates and delivery alerts."
              value={prefs.push}
              onValueChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
            />
            <Divider />
            <NotifRow
              icon="mail-outline"
              title="Email notifications"
              description="KYC decisions and account messages."
              value={prefs.email}
              onValueChange={(v) => setPrefs((p) => ({ ...p, email: v }))}
            />
            <Divider />
            <NotifRow
              icon="chatbox-ellipses-outline"
              title="SMS notifications"
              description="Phone alerts when supported."
              value={prefs.sms}
              onValueChange={(v) => setPrefs((p) => ({ ...p, sms: v }))}
            />
          </View>

          {/* ── LANGUAGE ── */}
          <SectionHeader title="APP LANGUAGE" />
          <View style={groupStyle}>
            {LANGUAGES.map((lang, i) => (
              <View key={lang.code}>
                <Pressable
                  onPress={() => setLanguage(lang.code as "en" | "rw" | "fr")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "800", flex: 1 }}>
                    {lang.name}
                  </Text>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: language === lang.code ? COLORS.PRIMARY : COLORS.TEXT_LIGHT,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {language === lang.code && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: COLORS.PRIMARY,
                        }}
                      />
                    )}
                  </View>
                </Pressable>
                {i < LANGUAGES.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          {/* ── HELP ── */}
          <View style={[groupStyle, { marginBottom: 24 }]}>
            <Pressable
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={iconBoxStyle}>
                <Ionicons name="headset-outline" size={16} color={COLORS.TEXT_SECONDARY} />
              </View>
              <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800" }}>
                Help Center
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
            </Pressable>
          </View>

          {/* Save + Logout */}
          <Pressable
            disabled={saving}
            onPress={save}
            style={{
              alignItems: "center",
              backgroundColor: COLORS.PRIMARY,
              borderRadius: 14,
              opacity: saving ? 0.7 : 1,
              paddingVertical: 15,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15 }}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="log-out-outline" size={19} color={COLORS.ERROR} />
              <Text style={{ color: COLORS.ERROR, fontWeight: "900" }}>Log Out</Text>
            </Pressable>
            <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>Version 1.0.0</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: COLORS.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 4,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: COLORS.BORDER_LIGHT,
        marginHorizontal: 14,
      }}
    />
  );
}

function FieldRow({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 4, minHeight: 48 }}>
      <View style={iconBoxStyle}>
        <Ionicons name={icon} size={16} color={COLORS.TEXT_SECONDARY} />
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14, minHeight: 48 }}>
      <View style={iconBoxStyle}>
        <Ionicons name={icon} size={16} color={COLORS.TEXT_SECONDARY} />
      </View>
      <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1, fontWeight: "800" }}>{label}</Text>
      {value ? (
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 13, fontWeight: "700", marginRight: 4 }}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
    </View>
  );
}

function NotifRow({
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
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: COLORS.PRIMARY_LIGHT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11, marginTop: 2, lineHeight: 16 }}>
          {description}
        </Text>
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

// ─── Styles ────────────────────────────────────────────────────────

const groupStyle = {
  backgroundColor: COLORS.SURFACE,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.BORDER_LIGHT,
  overflow: "hidden" as const,
  marginBottom: 20,
};

const inputStyle = {
  color: COLORS.TEXT_PRIMARY,
  flex: 1,
  fontWeight: "800" as const,
  paddingVertical: 10,
  fontSize: 14,
};

const iconBoxStyle = {
  alignItems: "center" as const,
  borderColor: COLORS.BORDER,
  borderRadius: 7,
  borderWidth: 1,
  height: 24,
  justifyContent: "center" as const,
  width: 24,
};
