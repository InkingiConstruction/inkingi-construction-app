import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
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

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const [prefs, setPrefs] = useState<Prefs>({ push: true, email: true, sms: false });
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ gap: 6, marginBottom: 22 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 28, fontWeight: "900" }}>
            Settings
          </Text>
          <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>
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
