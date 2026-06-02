import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { useAuthStore, User } from "@/store/auth.store";

type Prefs = {
  push: boolean;
  email: boolean;
  sms: boolean;
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const [prefs, setPrefs] = useState<Prefs>({ push: true, email: true, sms: false });
  const [language, setLanguage] = useState<'en' | 'rw' | 'fr'>('en');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPrefs({
      push: user?.notificationPrefs?.push ?? true,
      email: user?.notificationPrefs?.email ?? true,
      sms: user?.notificationPrefs?.sms ?? false,
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await api.patch<{ user: User }>(ENDPOINTS.AUTH.UPDATE_PROFILE, {
        notificationPrefs: prefs,
      });
      useAuthStore.setState({ user: response.data.user, isAuthenticated: true });
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getFirstLetter = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Header with Back Button */}
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 20, fontWeight: "900" }}>
            Settings
          </Text>
        </View>

        {/* Profile Navigation Card */}
        <Pressable
          onPress={() => router.push("/(client)/profile")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.SURFACE,
            borderColor: COLORS.BORDER_LIGHT,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: COLORS.PRIMARY_LIGHT,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {user?.avatar || user?.image ? (
              <Image
                source={{ uri: user.avatar || user.image || "" }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 22, fontWeight: "bold", color: COLORS.PRIMARY_DARK }}>
                {getFirstLetter()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "bold", color: COLORS.TEXT_PRIMARY }}>
              {user?.name || "Account Profile"}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>
              {user?.email || "Manage personal details & KYC"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ backgroundColor: COLORS.PRIMARY_LIGHT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, color: COLORS.PRIMARY_DARK, fontWeight: "bold", textTransform: "uppercase" }}>
                {user?.role || "Client"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_LIGHT} />
          </View>
        </Pressable>

        {/* Notifications Section */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>
            Notifications
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>
            Control how Inkingi sends project and account updates.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.SURFACE,
            borderColor: COLORS.BORDER_LIGHT,
            borderRadius: 18,
            borderWidth: 1,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <SettingRow
            icon="notifications-outline"
            title="Push notifications"
            description="Project assignments, inspections, and delivery updates."
            value={prefs.push}
            onValueChange={(push) => setPrefs((current) => ({ ...current, push }))}
          />
          <SettingRow
            icon="mail-outline"
            title="Email notifications"
            description="Verification, KYC decisions, and important account messages."
            value={prefs.email}
            onValueChange={(email) => setPrefs((current) => ({ ...current, email }))}
          />
          <SettingRow
            icon="chatbox-ellipses-outline"
            title="SMS notifications"
            description="Phone alerts when supported by your account."
            value={prefs.sms}
            onValueChange={(sms) => setPrefs((current) => ({ ...current, sms }))}
          />
        </View>

        {/* App Language Section */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: "900" }}>
            App Language
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13 }}>
            Select your preferred interface language.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.SURFACE,
            borderColor: COLORS.BORDER_LIGHT,
            borderRadius: 18,
            borderWidth: 1,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          {LANGUAGES.map((lang, index) => (
            <LanguageRow
              key={lang.code}
              code={lang.code}
              name={lang.name}
              flag={lang.flag}
              isSelected={language === lang.code}
              onSelect={() => setLanguage(lang.code as 'en' | 'rw' | 'fr')}
              isLast={index === LANGUAGES.length - 1}
            />
          ))}
        </View>

        {message ? (
          <Text style={{ color: COLORS.SUCCESS, fontSize: 12, fontWeight: "800", marginTop: 14 }}>
            {message}
          </Text>
        ) : null}
        {error ? (
          <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 14 }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          disabled={saving}
          onPress={save}
          style={{
            alignItems: "center",
            backgroundColor: COLORS.PRIMARY,
            borderRadius: 12,
            marginTop: 18,
            opacity: saving ? 0.7 : 1,
            paddingVertical: 15,
          }}
        >
          <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
            {saving ? "Saving..." : "Save Settings"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingRow({ icon, title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View
      style={{
        alignItems: "center",
        borderBottomColor: COLORS.BORDER_LIGHT,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: 12,
        padding: 16,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: COLORS.PRIMARY_LIGHT,
          borderRadius: 14,
          height: 44,
          justifyContent: "center",
          width: 44,
        }}
      >
        <Ionicons name={icon} size={22} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, lineHeight: 17, marginTop: 3 }}>
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

type LanguageRowProps = {
  code: string;
  name: string;
  flag: string;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
};

function LanguageRow({ code, name, flag, isSelected, onSelect, isLast }: LanguageRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => ({
        alignItems: "center",
        borderBottomColor: COLORS.BORDER_LIGHT,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: "row",
        gap: 12,
        padding: 16,
        backgroundColor: pressed ? COLORS.MUTED : "transparent",
      })}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: COLORS.PRIMARY_LIGHT,
          borderRadius: 14,
          height: 44,
          justifyContent: "center",
          width: 44,
        }}
      >
        <Text style={{ fontSize: 20 }}>{flag}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{name}</Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: isSelected ? COLORS.PRIMARY : COLORS.TEXT_LIGHT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isSelected && (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: COLORS.PRIMARY,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}
