import { useThemeColors } from "@/hooks/useThemeColors";
import { useExpoPushNotifications } from "@/hooks/useExpoPushNotifications";
import { useAuthStore } from "@/store/auth.store";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export default function RootLayout() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const { colors, isDark } = useThemeColors();
  useExpoPushNotifications();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StripeProvider
            merchantIdentifier="merchant.com.inkingi"
            publishableKey={stripePublishableKey}
            urlScheme="inkingi"
          >
            <StatusBar
              hidden={false}
              style={isDark ? "light" : "dark"}
              backgroundColor={colors.BACKGROUND}
              translucent={false}
            />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(engineer)" />
              <Stack.Screen name="(supervisor)" />
              <Stack.Screen name="(supplier)" />
            </Stack>
          </StripeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
