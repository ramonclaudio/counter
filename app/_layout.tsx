import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useGlobalSearchParams, type Href, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useCallback } from "react";
import { View, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";

import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { useColorScheme, useColors } from "@/hooks/use-theme";
import { RevenueCatProvider } from "@/providers/revenuecat-provider";
import {
  usePushNotifications,
  useNotificationListeners,
  clearBadge,
  getInitialNotificationResponse,
} from "@/hooks/use-push-notifications";
import { isValidDeepLink } from "@/lib/deep-link";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { Duration } from "@/constants/ui";

const convex = new ConvexReactClient(env.convexUrl, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export { AppErrorBoundary as ErrorBoundary } from "@/components/ui/error-boundary";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: Duration.splash, fade: true });

export const unstable_settings = { initialRouteName: "(auth)" };

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <RevenueCatProvider>
        <RootNavigator />
      </RevenueCatProvider>
    </ConvexBetterAuthProvider>
  );
}

function useNotificationDeepLink() {
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string" && isValidDeepLink(url)) {
      router.push(url as Href);
    }
  }, []);

  useEffect(() => {
    getInitialNotificationResponse()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch((error) => {
        if (__DEV__) console.warn("[DeepLink] Failed to get initial notification:", error);
      });
  }, [handleNotificationResponse]);

  useNotificationListeners(undefined, handleNotificationResponse);
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  usePushNotifications();
  useNotificationDeepLink();

  useEffect(() => {
    clearBadge();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") clearBadge();
    });
    return () => subscription.remove();
  }, []);

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
