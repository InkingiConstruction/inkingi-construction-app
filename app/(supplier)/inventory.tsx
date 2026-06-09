import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import { SupplierInventoryItem } from "@/components/supplier/supplier-types";
import { COLORS } from "@/constants/colors";

const MATERIAL_CATEGORIES = [
  "Cement",
  "Rebar",
  "Aggregates",
  "Sand",
  "Timber",
  "Bricks & Blocks",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Paint & Finishes",
  "Hardware",
  "Equipment Rental",
  "Labor Service",
];

export default function SupplierInventory() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(MATERIAL_CATEGORIES[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [notes, setNotes] = useState("");

  const inventoryQuery = useQuery({
    queryKey: ["supplier-inventory"],
    queryFn: async () =>
      (await api.get<SupplierInventoryItem[]>(ENDPOINTS.SUPPLIER_INVENTORY.LIST, {
        params: { includeUnavailable: true },
      })).data,
    refetchOnMount: "always",
  });

  const items = inventoryQuery.data || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!category.trim() || !name.trim() || !unit.trim() || !unitPrice.trim()) {
        throw new Error("Category, item name, unit and unit price are required.");
      }

      return api.post(ENDPOINTS.SUPPLIER_INVENTORY.CREATE, {
        category: category.trim(),
        name: name.trim(),
        unit: unit.trim(),
        unitPrice: Number(unitPrice),
        deliveryFee: deliveryFee.trim() ? Number(deliveryFee) : undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setName("");
      setUnit("");
      setUnitPrice("");
      setDeliveryFee("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["supplier-inventory"] });
      Alert.alert("Item published", "This item is now available in your storefront.");
    },
    onError: (error) => Alert.alert("Create failed", error instanceof Error ? error.message : "Try again."),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <ScrollView
        contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={inventoryQuery.isRefetching} onRefresh={inventoryQuery.refetch} tintColor={COLORS.PRIMARY} />}
      >
        <SupplierTopBar title="My Storefront" subtitle="Publish materials and standard prices for engineer BOQs." />

        <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, gap: 10, padding: 16 }}>
          <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>New inventory item</Text>
          <View style={{ flexDirection: "row", gap: 10, zIndex: 20 }}>
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={() => setCategoryOpen((prev) => !prev)}
                style={{
                  alignItems: "center",
                  backgroundColor: COLORS.MUTED,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: COLORS.TEXT_PRIMARY, flex: 1 }}>{category}</Text>
                <Ionicons name={categoryOpen ? "chevron-up" : "chevron-down"} size={18} color={COLORS.TEXT_SECONDARY} />
              </Pressable>
              {categoryOpen ? (
                <View style={{
                  backgroundColor: COLORS.SURFACE,
                  borderColor: COLORS.BORDER_LIGHT,
                  borderRadius: 8,
                  borderWidth: 1,
                  left: 0,
                  maxHeight: 220,
                  overflow: "hidden",
                  position: "absolute",
                  right: 0,
                  top: 50,
                  zIndex: 30,
                }}>
                  <ScrollView nestedScrollEnabled>
                    {MATERIAL_CATEGORIES.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setCategory(item);
                          setCategoryOpen(false);
                        }}
                        style={{ borderBottomColor: COLORS.BORDER_LIGHT, borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 12 }}
                      >
                        <Text style={{ color: item === category ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY, fontWeight: item === category ? "900" : "500" }}>{item}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
            <Input placeholder="Unit" value={unit} onChangeText={setUnit} />
          </View>
          <Input placeholder="Material / service name" value={name} onChangeText={setName} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Input keyboardType="numeric" placeholder="Unit price" value={unitPrice} onChangeText={setUnitPrice} />
            <Input keyboardType="numeric" placeholder="Delivery fee" value={deliveryFee} onChangeText={setDeliveryFee} />
          </View>
          <Input placeholder="Notes" value={notes} onChangeText={setNotes} />
          <Pressable
            disabled={createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", opacity: createMutation.isPending ? 0.7 : 1, paddingVertical: 13 }}
          >
            <Ionicons name="storefront-outline" size={18} color={COLORS.TEXT_WHITE} />
            <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createMutation.isPending ? "Publishing..." : "Publish item"}</Text>
          </Pressable>
        </View>

        {inventoryQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 30 }} /> : null}
        {items.length === 0 && !inventoryQuery.isLoading ? <Empty text="No storefront items yet. Publish your first material price." /> : null}
        {items.map((item) => (
          <View key={item.id} style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 16 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Ionicons name="cube-outline" size={22} color={COLORS.PRIMARY} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.name}</Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>
                  {item.category} • {item.unit}
                </Text>
              </View>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                {Number(item.unitPrice || 0).toLocaleString()} RWF
              </Text>
            </View>
            {item.deliveryFee ? (
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12, marginTop: 8 }}>
                Delivery fee: {Number(item.deliveryFee).toLocaleString()} RWF
              </Text>
            ) : null}
            {item.notes ? <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 19, marginTop: 8 }}>{item.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      style={{
        backgroundColor: COLORS.MUTED,
        borderColor: COLORS.BORDER_LIGHT,
        borderRadius: 8,
        borderWidth: 1,
        color: COLORS.TEXT_PRIMARY,
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    />
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 18 }}>
      <Text style={{ color: COLORS.TEXT_SECONDARY, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
