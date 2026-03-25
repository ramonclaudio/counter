import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { ElevenLabsProvider } from "@elevenlabs/react-native";
import { registerGlobals } from "@livekit/react-native";

import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { useColorScheme, useColors } from "@/hooks/use-theme";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { Duration } from "@/constants/ui";

registerGlobals();

const convex = new ConvexReactClient(env.convexUrl, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export { AppErrorBoundary as ErrorBoundary } from "@/components/ui/error-boundary";

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#000000");
SplashScreen.setOptions({ duration: Duration.splash, fade: true });

export const unstable_settings = { initialRouteName: "(auth)" };

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <ElevenLabsProvider>
        <RootNavigator />
      </ElevenLabsProvider>
    </ConvexBetterAuthProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (__DEV__) console.log("[Screen]", pathname, params);
  }, [pathname, params]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  const colors = useColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <NavigationThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
                animationDuration: 250,
              }}
            >
              <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>

              <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>

              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <OfflineBanner />
          </View>
        </NavigationThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
