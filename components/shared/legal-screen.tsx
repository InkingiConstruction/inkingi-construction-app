import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

type LegalKind = "privacy" | "terms";

const updatedAt = "June 9, 2026";

const privacySections = [
  {
    title: "Information we collect",
    body: "Inkingi may collect account details, contact information, role and KYC details, project records, uploaded media, messages, payment activity, device push tokens, and usage diagnostics needed to operate construction workflows.",
  },
  {
    title: "How we use information",
    body: "We use information to create accounts, verify users, assign project teams, manage milestones, BOQs, payments, deliveries, progress reviews, notifications, support requests, fraud prevention, and platform security.",
  },
  {
    title: "Sharing and visibility",
    body: "Project information is shown only to users who need it for their role, such as the project client, main contractor, supervisor, supplier, or site agent. Private contact details should remain protected where in-app communication is available.",
  },
  {
    title: "Payments and security",
    body: "Payment and wallet records are used to support funding, escrow, milestone release, and audit history. Sensitive payment actions may require PIN or biometric confirmation on the device.",
  },
  {
    title: "Data retention",
    body: "We keep records while your account or project is active and for a reasonable period after that for legal, accounting, dispute resolution, and operational audit purposes.",
  },
  {
    title: "Your choices",
    body: "You can update profile information, notification preferences, and account details in the app. For access, correction, deletion, or support requests, contact the Inkingi team.",
  },
];

const termsSections = [
  {
    title: "Use of the platform",
    body: "Inkingi is intended to coordinate construction projects between clients, main contractors, supervisors, suppliers, and site agents. Users must provide accurate information and use the platform only for lawful project activity.",
  },
  {
    title: "Account responsibility",
    body: "You are responsible for protecting your login credentials, payment PIN, device access, and any actions taken from your account. Notify support if you suspect unauthorized access.",
  },
  {
    title: "Project workflow",
    body: "Clients create projects and assign teams. Main contractors submit milestones and BOQs. Supervisors review submissions and progress. Clients release payments after approved milestones according to the platform workflow.",
  },
  {
    title: "Payments and escrow",
    body: "Wallet, project funding, and milestone release features depend on available provider integrations and successful payment confirmation. Inkingi records payment activity to support audit and dispute handling.",
  },
  {
    title: "Content and uploads",
    body: "Users are responsible for uploaded project documents, photos, videos, captions, delivery proofs, and messages. Content must not be fraudulent, illegal, abusive, or unrelated to the project.",
  },
  {
    title: "Limitations",
    body: "The platform helps manage workflows and records, but it does not replace professional engineering judgment, legal advice, safety obligations, or contractual responsibilities between project parties.",
  },
];

export function LegalScreen({ kind }: { kind: LegalKind }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const subtitle = isPrivacy
    ? "How Inkingi handles account, project, payment, and communication data."
    : "Rules for using Inkingi project, payment, and construction workflows.";
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
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
            <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11, fontWeight: "900" }}>LEGAL</Text>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 27, fontWeight: "900" }}>{title}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: COLORS.INK, borderRadius: 12, marginBottom: 14, padding: 18 }}>
          <Ionicons
            name={isPrivacy ? "shield-checkmark-outline" : "document-text-outline"}
            size={28}
            color={COLORS.TEXT_WHITE}
          />
          <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 20, fontWeight: "900", marginTop: 12 }}>{title}</Text>
          <Text style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 19, marginTop: 6 }}>{subtitle}</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "800", marginTop: 12 }}>
            Last updated: {updatedAt}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {sections.map((section) => (
            <View
              key={section.title}
              style={{
                backgroundColor: COLORS.SURFACE,
                borderColor: COLORS.BORDER_LIGHT,
                borderRadius: 10,
                borderWidth: 1,
                padding: 15,
              }}
            >
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "900" }}>{section.title}</Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 6 }}>{section.body}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, lineHeight: 18, marginTop: 16, textAlign: "center" }}>
          This in-app legal text is a product notice and should be reviewed by the business/legal team before public launch.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
