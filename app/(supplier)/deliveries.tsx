import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import { SupplierDelivery, SupplierPurchaseOrder } from "@/components/supplier/supplier-types";

export default function SupplierDeliveries() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: async () => (await api.get<SupplierPurchaseOrder[]>(ENDPOINTS.PURCHASE_ORDERS.LIST)).data,
  });
  const deliveriesQuery = useQuery({
    queryKey: ["supplier-deliveries"],
    queryFn: async () => (await api.get<SupplierDelivery[]>(ENDPOINTS.DELIVERIES.LIST)).data,
  });

  const acceptedOrders = (ordersQuery.data || []).filter((order) => order.status === "accepted");

  const createDelivery = useMutation({
    mutationFn: () => api.post(ENDPOINTS.DELIVERIES.CREATE, { purchaseOrderId: selectedOrderId, notes, status: "preparing" }),
    onSuccess: () => {
      setSelectedOrderId("");
      setNotes("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["supplier-deliveries"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to create delivery"),
  });
  const updateDelivery = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(ENDPOINTS.DELIVERIES.DETAIL(id), { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier-deliveries"] }),
  });

  const submit = () => {
    if (!selectedOrderId) {
      setError("Select an accepted purchase order");
      return;
    }
    createDelivery.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={deliveriesQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 160 }}
        ListHeaderComponent={
          <View>
            <SupplierTopBar title="Deliveries" subtitle="Create delivery records and update status." />
            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, marginBottom: 14, padding: 14 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>Start delivery</Text>
              <FlatList
                data={acceptedOrders}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
                renderItem={({ item }) => {
                  const selected = selectedOrderId === item.id;
                  return (
                    <Pressable onPress={() => setSelectedOrderId(item.id)} style={{ backgroundColor: selected ? COLORS.PRIMARY : COLORS.MUTED, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 }}>
                      <Text style={{ color: selected ? COLORS.TEXT_WHITE : COLORS.TEXT_PRIMARY, fontWeight: "900" }}>{item.poNumber}</Text>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={<Text style={{ color: COLORS.TEXT_SECONDARY }}>No accepted orders ready for delivery.</Text>}
              />
              <TextInput onChangeText={setNotes} placeholder="Delivery notes" placeholderTextColor={COLORS.TEXT_LIGHT} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, color: COLORS.TEXT_PRIMARY, padding: 12 }} value={notes} />
              {error ? <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 8 }}>{error}</Text> : null}
              <Pressable disabled={createDelivery.isPending} onPress={submit} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, marginTop: 12, opacity: createDelivery.isPending ? 0.7 : 1, paddingVertical: 13 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createDelivery.isPending ? "Creating..." : "Create Delivery"}</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={deliveriesQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : <Text style={{ color: COLORS.TEXT_SECONDARY }}>No deliveries yet.</Text>}
        refreshControl={<RefreshControl refreshing={deliveriesQuery.isRefetching} onRefresh={deliveriesQuery.refetch} tintColor={COLORS.PRIMARY} />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 15 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.purchaseOrder?.poNumber || "Delivery"}</Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 5 }}>{item.notes || "No notes"} • {item.status}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {["in_transit", "delivered", "pending_confirmation"].map((status) => (
                <Pressable key={status} onPress={() => updateDelivery.mutate({ id: item.id, status })} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, paddingVertical: 10 }}>
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 11, fontWeight: "900", textAlign: "center" }}>{status.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
