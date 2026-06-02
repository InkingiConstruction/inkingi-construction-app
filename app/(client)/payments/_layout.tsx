import { Stack } from "expo-router";

export default function PaymentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="deposit" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="passcode-setup" />
      <Stack.Screen name="transaction-detail" />
      <Stack.Screen name="verify-passcode" />
    </Stack>
  );
}
