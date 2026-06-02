import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import { SupplierQuote } from "@/components/supplier/supplier-types";

export default function SupplierQuotes() {
  const quotesQuery = useQuery({
    queryKey: ["supplier-quotes"],
    queryFn: async () => (await api.get<SupplierQuote[]>(ENDPOINTS.QUOTES.LIST)).data,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={quotesQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 120 }}
        ListHeaderComponent={<SupplierTopBar title="My Quotes" subtitle="Track quote selection and pricing history." />}
        ListEmptyComponent={quotesQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : <Text style={{ color: COLORS.TEXT_SECONDARY }}>No submitted quotes yet.</Text>}
        refreshControl={<RefreshControl refreshing={quotesQuery.isRefetching} onRefresh={quotesQuery.refetch} tintColor={COLORS.PRIMARY} />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 15 }}>
            <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.rfq?.title || "Quote"}</Text>
            <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 5 }}>{item.rfq?.project?.name || "Project"}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Chip label={`Total ${item.totalPrice}`} />
              <Chip label={`${item.deliveryDays} days`} />
              <Chip label={item.status} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  return <Text style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, color: COLORS.TEXT_PRIMARY, flex: 1, fontSize: 11, fontWeight: "800", padding: 9, textAlign: "center" }}>{label}</Text>;
}
