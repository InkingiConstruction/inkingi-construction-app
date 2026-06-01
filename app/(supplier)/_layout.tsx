import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rfqs" />
      <Stack.Screen name="quotes" />
      <Stack.Screen name="purchase-orders" />
      <Stack.Screen name="deliveries" />
    </Stack>
  );
}
