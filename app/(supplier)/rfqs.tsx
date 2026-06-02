import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { COLORS } from "@/constants/colors";
import { SupplierTopBar } from "@/components/supplier/supplier-top-bar";
import { SupplierRfq } from "@/components/supplier/supplier-types";

export default function SupplierRfqs() {
  const queryClient = useQueryClient();
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState("");

  const rfqsQuery = useQuery({
    queryKey: ["supplier-rfqs"],
    queryFn: async () => (await api.get<SupplierRfq[]>(ENDPOINTS.RFQS.LIST)).data,
  });

  const createQuote = useMutation({
    mutationFn: () =>
      api.post(ENDPOINTS.QUOTES.CREATE, {
        rfqId: selectedRfqId,
        unitPrice,
        deliveryDays,
        terms,
      }),
    onSuccess: () => {
      setSelectedRfqId("");
      setUnitPrice("");
      setDeliveryDays("");
      setTerms("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["supplier-rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to submit quote"),
  });

  const submit = () => {
    if (!selectedRfqId || !unitPrice || !deliveryDays) {
      setError("Select an RFQ, enter unit price and delivery days");
      return;
    }
    createQuote.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      <FlatList
        data={rfqsQuery.data || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 180 }}
        ListHeaderComponent={
          <View>
            <SupplierTopBar title="Available RFQs" subtitle="Choose a material request and submit your quote." />
            <View style={{ backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, marginBottom: 14, padding: 14 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 17, fontWeight: "900" }}>Submit quote</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Input placeholder="Unit price" value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" />
                <Input placeholder="Days" value={deliveryDays} onChangeText={setDeliveryDays} keyboardType="number-pad" />
              </View>
              <TextInput
                onChangeText={setTerms}
                placeholder="Terms"
                placeholderTextColor={COLORS.TEXT_LIGHT}
                style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, color: COLORS.TEXT_PRIMARY, marginTop: 10, padding: 12 }}
                value={terms}
              />
              {error ? <Text style={{ color: COLORS.ERROR, fontSize: 12, fontWeight: "800", marginTop: 8 }}>{error}</Text> : null}
              <Pressable disabled={createQuote.isPending} onPress={submit} style={{ alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 8, marginTop: 12, opacity: createQuote.isPending ? 0.7 : 1, paddingVertical: 13 }}>
                <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>{createQuote.isPending ? "Submitting..." : "Submit Quote"}</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={rfqsQuery.isLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : <Empty text="No open RFQs available." />}
        refreshControl={<RefreshControl refreshing={rfqsQuery.isRefetching} onRefresh={rfqsQuery.refetch} tintColor={COLORS.PRIMARY} />}
        renderItem={({ item }) => {
          const selected = selectedRfqId === item.id;
          return (
            <Pressable onPress={() => setSelectedRfqId(item.id)} style={{ backgroundColor: selected ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE, borderColor: selected ? COLORS.PRIMARY : COLORS.BORDER_LIGHT, borderRadius: 10, borderWidth: 1, padding: 15 }}>
              <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: "900" }}>{item.title}</Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20, marginTop: 5 }}>{item.project?.name || "Project"} • {item.milestone?.name || "Milestone"}</Text>
              <Text style={{ color: COLORS.PRIMARY, fontSize: 12, fontWeight: "900", marginTop: 8 }}>{item.quantity} {item.unit} • due {new Date(item.deadline).toLocaleDateString()}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Input({ placeholder, value, onChangeText, keyboardType }: { placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType: "decimal-pad" | "number-pad" }) {
  return <TextInput keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.TEXT_LIGHT} style={{ backgroundColor: COLORS.MUTED, borderRadius: 8, color: COLORS.TEXT_PRIMARY, flex: 1, padding: 12 }} value={value} />;
}

function Empty({ text }: { text: string }) {
  return <Text style={{ color: COLORS.TEXT_SECONDARY, lineHeight: 20 }}>{text}</Text>;
}
