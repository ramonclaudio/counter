import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useConvexAuth } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-theme";

const ONBOARDING_KEY = "counter_onboarding_seen";

export default function Index() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const colors = useColors();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/(auth)/sign-in");
      return;
    }
    AsyncStorage.getItem(ONBOARDING_KEY).then((seen) => {
      router.replace(seen ? "/(app)" : "/(app)/welcome");
      setChecking(false);
    });
  }, [isAuthenticated, isLoading]);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
