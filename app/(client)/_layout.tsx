import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="create-project" />
      <Stack.Screen name="assign-engineer" />
      <Stack.Screen name="assign-supervisor" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="progress" />
    </Stack>
  );
}
