import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { ThemedText } from "@/components/ui/themed-text";
import { Opacity } from "@/constants/ui";
import { useColors } from "@/hooks/use-theme";
import { FontFamily } from "@/constants/layout";

export function UserAvatar({ size = 36 }: { size?: number }) {
  const colors = useColors();
  const user = useQuery(api.auth.getCurrentUser);
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <Pressable
      onPress={() => router.push("/(app)/settings")}
      style={({ pressed }) => ({ opacity: pressed ? Opacity.pressed : 1 })}
      accessibilityRole="button"
      accessibilityLabel="Dashboard"
      accessibilityHint="Opens your dashboard"
    >
      {user?.image ? (
        <Image
          source={{ uri: user.image }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: colors.border,
          }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: colors.borderAccent,
          }}
        >
          <ThemedText
            style={{ fontSize: size * 0.42, fontFamily: FontFamily.bold }}
            color={colors.primary}
          >
            {initial}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}
