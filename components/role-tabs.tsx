import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

type TabIcon = keyof typeof Ionicons.glyphMap;

export type RoleTab = {
  name: string;
  title: string;
  icon: TabIcon;
};

type RoleTabsProps = {
  tabs: RoleTab[];
  hiddenRoutes?: string[];
};

export function RoleTabs({ tabs, hiddenRoutes = [] }: RoleTabsProps) {
  const insets = useSafeAreaInsets();
  const tabNames = new Set(tabs.map((tab) => tab.name));
  const hiddenOnlyRoutes = hiddenRoutes.filter((name) => !tabNames.has(name));
  const crowded = tabs.length > 5;
  const bottomInset = insets.bottom;
  const fallbackBottomPadding = Platform.OS === "ios" ? 20 : 40;
  const paddingBottom =
    Platform.OS === "android"
      ? Math.max(bottomInset, fallbackBottomPadding)
      : bottomInset > 0
        ? bottomInset
        : fallbackBottomPadding;
  const baseTabBarHeight = crowded ? 60 : 64;
  const tabBarHeight = baseTabBarHeight + paddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_LIGHT,
        tabBarLabelStyle: {
          fontSize: crowded ? 9 : 10,
          fontWeight: "800",
          paddingBottom: Platform.OS === "android" ? 0 : 0,
        },
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopColor: COLORS.BORDER_LIGHT,
          borderTopWidth: 1,
          elevation: 10,
          height: tabBarHeight,
          paddingBottom,
          paddingTop: crowded ? 6 : 8,
          shadowColor: "#064E3B",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.icon : tab.icon}
                size={crowded ? Math.min(size, 22) : size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {hiddenOnlyRoutes.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
