import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/store/auth.store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

export default function RootLayout() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const { colors, isDark } = useThemeColors();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={colors.BACKGROUND}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(engineer)" />
          <Stack.Screen name="(supervisor)" />
          <Stack.Screen name="(supplier)" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
