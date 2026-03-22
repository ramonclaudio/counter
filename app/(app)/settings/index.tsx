import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";
import { Radius } from "@/constants/theme";
import { Spacing, FontSize, IconSize } from "@/constants/layout";
import { Opacity } from "@/constants/ui";

export default function SettingsScreen() {
  const colors = useColors();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    haptics.light();
    await authClient.signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
      <View style={{ flex: 1, padding: Spacing.xl, gap: Spacing.lg }}>
        <ThemedText variant="title">Settings</ThemedText>

        {session?.user && (
          <View style={{ alignItems: "center", gap: Spacing.xs, paddingVertical: Spacing.lg }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <ThemedText style={{ fontSize: FontSize["2xl"], fontWeight: "700" }} color={colors.primaryForeground}>
                {session.user.name?.charAt(0).toUpperCase() ?? "?"}
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: FontSize.lg, fontWeight: "600" }}>{session.user.name}</ThemedText>
            <ThemedText style={{ fontSize: FontSize.sm }} color={colors.mutedForeground}>{session.user.email}</ThemedText>
          </View>
        )}

        <ThemedText style={{ fontSize: FontSize.sm, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 }} color={colors.mutedForeground}>
          Account
        </ThemedText>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            opacity: pressed ? Opacity.pressed : 1,
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            borderRadius: Radius.lg,
            borderCurve: "continuous",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          })}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={IconSize.md} color={colors.destructive} />
          <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.destructive}>
            Sign Out
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
