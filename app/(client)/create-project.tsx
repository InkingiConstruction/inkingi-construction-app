import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { ClientTopBar } from "@/components/client/client-top-bar";
import { COLORS } from "@/constants/colors";

type PickedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function CreateProject() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setImages(result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      })));
    }
  };

  const submit = async () => {
    if (!name.trim() || !budget.trim()) {
      Alert.alert("Missing details", "Project name and budget are required.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("budget", budget.trim());
      form.append("currency", currency.trim() || "RWF");
      if (address.trim()) form.append("address", address.trim());
      if (description.trim()) form.append("description", description.trim());
      if (startDate.trim()) form.append("startDate", startDate.trim());
      if (endDate.trim()) form.append("endDate", endDate.trim());

      images.forEach((image, index) => {
        form.append("sitePhotos", {
          uri: image.uri,
          name: image.fileName || `site-photo-${index + 1}.jpg`,
          type: image.mimeType || "image/jpeg",
        } as unknown as Blob);
      });

      await api.post(ENDPOINTS.PROJECTS.LIST, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-projects"] }),
        queryClient.invalidateQueries({ queryKey: ["client-escrow-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["client-milestones"] }),
      ]);

      Alert.alert("Project created", "Now assign your engineer from the project list.");
      router.replace("/(client)/projects");
    } catch (error) {
      Alert.alert("Create project failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <ClientTopBar
          title="Create Project"
          subtitle="Capture the project brief, site location, budget, and first site photos."
        />

        <View style={{ gap: 14 }}>
          <Panel title="Project basics">
            <Field label="Project name" value={name} onChangeText={setName} placeholder="e.g. Gacuriro residential build" />
            <Field label="Budget" value={budget} onChangeText={setBudget} placeholder="15000000" keyboardType="numeric" />
            <Field label="Currency" value={currency} onChangeText={setCurrency} placeholder="RWF" />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Kigali, Rwanda" />
          </Panel>

          <Panel title="Scope and dates">
            <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe what must be built" multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="2026-06-10" compact />
              <Field label="End date" value={endDate} onChangeText={setEndDate} placeholder="2026-09-30" compact />
            </View>
          </Panel>

          <Panel title="Site photos">
            <Pressable
              onPress={pickImages}
              style={{
                alignItems: "center",
                borderColor: COLORS.BORDER,
                borderRadius: 8,
                borderStyle: "dashed",
                borderWidth: 1,
                gap: 8,
                padding: 18,
              }}
            >
              <Ionicons name="images-outline" size={26} color={COLORS.PRIMARY} />
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>Upload site photos</Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, textAlign: "center" }}>
                Pick one or more real site images from the phone.
              </Text>
            </Pressable>

            {images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 12 }}>
                {images.map((image) => (
                  <Image key={image.uri} source={{ uri: image.uri }} style={{ borderRadius: 8, height: 84, width: 84 }} />
                ))}
              </ScrollView>
            ) : null}
          </Panel>

          <Pressable
            disabled={submitting}
            onPress={submit}
            style={{
              alignItems: "center",
              backgroundColor: submitting ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
              borderRadius: 8,
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              paddingVertical: 15,
            }}
          >
            {submitting ? <ActivityIndicator color={COLORS.TEXT_WHITE} /> : <Ionicons name="checkmark" size={20} color={COLORS.TEXT_WHITE} />}
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
              {submitting ? "Creating project..." : "Create project"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function Field({
  label,
  compact,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; compact?: boolean }) {
  return (
    <View style={{ flex: compact ? 1 : undefined, gap: 6 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: "900" }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        style={{
          backgroundColor: COLORS.MUTED,
          borderColor: COLORS.BORDER_LIGHT,
          borderRadius: 8,
          borderWidth: 1,
          color: COLORS.TEXT_PRIMARY,
          minHeight: props.multiline ? 96 : 48,
          paddingHorizontal: 13,
          paddingVertical: 11,
          textAlignVertical: props.multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
