import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const order: ThemePreference[] = ["system", "light", "dark"];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
      cyclePreference: () =>
        set((state) => {
          const nextIndex = (order.indexOf(state.preference) + 1) % order.length;
          return { preference: order[nextIndex] };
        }),
    }),
    {
      name: "inkingi-theme",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
