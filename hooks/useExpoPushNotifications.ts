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

type InAppNotification = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
};

export function useExpoPushNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const registeredUserId = useRef<string | null>(null);
  const seenInAppNotificationIds = useRef<Set<string>>(new Set());
  const initializedInAppFallback = useRef(false);

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

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      initializedInAppFallback.current = false;
      seenInAppNotificationIds.current = new Set();
      return;
    }

    let cancelled = false;

    const pollInAppNotifications = async () => {
      try {
        const response = await api.get<InAppNotification[]>(ENDPOINTS.NOTIFICATIONS.LIST, {
          params: { channel: "in_app" },
        });
        if (cancelled) return;

        const notifications = response.data || [];
        if (!initializedInAppFallback.current) {
          notifications.forEach((item) => seenInAppNotificationIds.current.add(item.id));
          initializedInAppFallback.current = true;
          return;
        }

        const newNotifications = notifications
          .filter((item) => !seenInAppNotificationIds.current.has(item.id))
          .reverse();

        for (const item of newNotifications) {
          seenInAppNotificationIds.current.add(item.id);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: item.title,
              body: item.body,
              data: item.data || {},
              sound: "default",
            },
            trigger: null,
          });
        }
      } catch {
        // Silent fallback: remote Expo push still handles background delivery.
      }
    };

    void pollInAppNotifications();
    const interval = setInterval(pollInAppNotifications, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, userId]);
}
