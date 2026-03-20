import { useCallback, useEffect, useState } from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Colors, type ColorPalette } from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

let globalMode: ThemeMode = "system";
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function updateGlobalMode(newMode: ThemeMode) {
  globalMode = newMode;
  Appearance.setColorScheme(newMode === "system" ? "unspecified" : newMode);
  SecureStore.setItemAsync(STORAGE_KEY, newMode).catch(() => {});
  notifyListeners();
}

(async () => {
  try {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (saved && ["system", "light", "dark"].includes(saved)) {
      globalMode = saved as ThemeMode;
      Appearance.setColorScheme(globalMode === "system" ? "unspecified" : globalMode);
      notifyListeners();
    }
  } catch {
  }
})();

export function useColorScheme(): "light" | "dark" {
  const systemScheme = useRNColorScheme();
  const resolved = systemScheme === "dark" ? "dark" : "light";
  return globalMode === "system" ? resolved : globalMode;
}

export function useThemeMode(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
  const [mode, setModeState] = useState<ThemeMode>(globalMode);

  useEffect(() => {
    const listener = () => setModeState(globalMode);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    updateGlobalMode(newMode);
    setModeState(newMode);
  }, []);

  return { mode, setMode };
}

export function useColors(): ColorPalette {
  useColorScheme();
  return Colors;
}
