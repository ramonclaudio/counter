import type { ReactNode } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { getErrorStyles } from "@/lib/auth-styles";
import { useColors } from "@/hooks/use-theme";

type ErrorBannerProps = {
  message: string | null;
  children?: ReactNode;
};

export function ErrorBanner({ message, children }: ErrorBannerProps) {
  const colors = useColors();
  if (!message) return null;
  const s = getErrorStyles(colors);
  return (
    <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={s.container}>
      <ThemedText selectable style={s.text}>
        {message}
      </ThemedText>
      {children}
    </View>
  );
}
