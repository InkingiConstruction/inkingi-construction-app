import { useColorScheme } from "react-native";
import {
  AppColorScheme,
  AppThemeColors,
  THEME_COLORS,
} from "@/constants/colors";
import { useThemeStore } from "@/store/theme.store";

export const useThemeColors = (): {
  colors: AppThemeColors;
  scheme: AppColorScheme;
  isDark: boolean;
  preference: "system" | "light" | "dark";
} => {
  const colorScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const scheme: AppColorScheme =
    preference === "system"
      ? colorScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  return {
    colors: THEME_COLORS[scheme],
    scheme,
    isDark: scheme === "dark",
    preference,
  };
};
