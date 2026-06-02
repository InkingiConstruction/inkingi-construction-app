import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { api } from "@/api/api";
import { ENDPOINTS } from "@/api/endpoints";
import { useAuthStore } from "@/store/auth.store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ||
  Constants.easConfig?.projectId;

export function useExpoPushNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const registeredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId || registeredUserId.current === userId) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      if (!Device.isDevice) {
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          importance: Notifications.AndroidImportance.MAX,
          lightColor: "#047857",
          name: "Default",
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const existingPermissions = await Notifications.getPermissionsAsync();
      let finalStatus = existingPermissions.status;

      if (finalStatus !== "granted") {
        const requestedPermissions = await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermissions.status;
      }

      if (finalStatus !== "granted") {
        return;
      }

      const projectId = getProjectId();

      if (!projectId) {
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      if (cancelled) return;

      await api.post(ENDPOINTS.NOTIFICATIONS.EXPO_TOKEN, {
        token: token.data,
      });

      registeredUserId.current = userId;
    };

    register().catch((error) => {
      console.warn("Expo push notification registration failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);
}
