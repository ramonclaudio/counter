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

  const handleSignOut = async () => {
    haptics.light();
    await authClient.signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom"]}>
      <View style={{ flex: 1, padding: Spacing.xl, gap: Spacing.lg }}>
        <ThemedText variant="title">Settings</ThemedText>

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
