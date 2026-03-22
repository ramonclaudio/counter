import { View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ui/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";
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
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          })}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={IconSize.md} color={colors.destructive} />
          <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.destructive}>
            Sign Out
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? Opacity.pressed : 1,
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          })}
          accessibilityRole="button"
          accessibilityLabel="Help and feedback"
        >
          <IconSymbol name="questionmark.circle" size={IconSize.md} color={colors.mutedForeground} />
          <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.mutedForeground}>
            Help & Feedback
          </ThemedText>
        </Pressable>
      </View>

      <View style={{ flex: 1 }} />
      <ThemedText style={{ fontSize: FontSize.xs, textAlign: "center", paddingBottom: Spacing.lg }} color={colors.tertiaryLabel}>
        Counter v{Constants.expoConfig?.version ?? "1.0.0"}
      </ThemedText>
    </SafeAreaView>
  );
}
