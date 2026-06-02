import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import { SupplierPurchaseOrder } from "@/components/supplier/supplier-types";

export default function SupplierPurchaseOrders() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: async () => (await api.get<SupplierPurchaseOrder[]>(ENDPOINTS.PURCHASE_ORDERS.LIST)).data,
  });

  const acceptOrder = useMutation({
    mutationFn: (id: string) => api.put(ENDPOINTS.PURCHASE_ORDERS.DETAIL(id), { status: "accepted" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-deliveries"] });
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={ordersQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={<SupplierTopBar title="Purchase Orders" subtitle="Accept issued purchase orders before delivery." />}
        ListEmptyComponent={ordersQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : <Text style={{ color: COLORS.TEXT_SECONDARY }}>No purchase orders issued yet.</Text>}
        refreshControl={<RefreshControl refreshing={ordersQuery.isRefetching} onRefresh={ordersQuery.refetch} tintColor={COLORS.PRIMARY} />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 15 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.poNumber}</Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 5 }}>{item.rfq?.title || "Purchase order"} • {item.status}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 13 }}>
              <Pressable onPress={() => Linking.openURL(item.cloudinaryUrl)} style={{ alignItems: "center", backgroundColor: COLORS.MUTED, borderRadius: 8, flex: 1, paddingVertical: 12 }}>
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>View PO</Text>
              </Pressable>
              {item.status === "issued" ? (
                <Pressable disabled={acceptOrder.isPending} onPress={() => acceptOrder.mutate(item.id)} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, flex: 1, opacity: acceptOrder.isPending ? 0.7 : 1, paddingVertical: 12 }}>
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>Accept</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
