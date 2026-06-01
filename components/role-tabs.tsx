import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

type TabIcon = keyof typeof Ionicons.glyphMap;

export type RoleTab = {
  name: string;
  title: string;
  icon: TabIcon;
};

type RoleTabsProps = {
  tabs: RoleTab[];
};

export function RoleTabs({ tabs }: RoleTabsProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.PRIMARY,
        tabBarInactiveTintColor: colors.TEXT_LIGHT,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          paddingBottom: Platform.OS === "android" ? 2 : 0,
        },
        tabBarStyle: {
          backgroundColor: colors.SURFACE,
          borderTopColor: colors.BORDER_LIGHT,
          borderTopWidth: 1,
          elevation: 10,
          height: Platform.OS === "ios" ? 86 : 68,
          paddingBottom: Platform.OS === "ios" ? 22 : 8,
          paddingTop: 8,
          shadowColor: isDark ? "#000000" : "#064E3B",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.3 : 0.08,
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.icon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
