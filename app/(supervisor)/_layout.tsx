import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="inspections" />
      <Stack.Screen name="progress-review" />
    </Stack>
  );
}
