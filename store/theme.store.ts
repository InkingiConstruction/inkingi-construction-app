import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const order: ThemePreference[] = ["system", "light", "dark"];

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  setPreference: (preference) => set({ preference }),
  cyclePreference: () =>
    set((state) => {
      const nextIndex = (order.indexOf(state.preference) + 1) % order.length;
      return { preference: order[nextIndex] };
    }),
}));
