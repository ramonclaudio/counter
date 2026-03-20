import { Stack } from "expo-router";
import { View } from "react-native";

import { useColors } from "@/hooks/use-theme";
import { HeaderTint } from "@/constants/theme";

export const unstable_settings = { initialRouteName: "index" };

export { AppErrorBoundary as ErrorBoundary } from "@/components/ui/error-boundary";

export default function AppLayout() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: "Back",
          headerTintColor: HeaderTint as string,
          headerBackground: () => (
            <View style={{ flex: 1, backgroundColor: colors.background }} />
          ),
          headerShadowVisible: false,
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
