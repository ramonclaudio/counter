import { View, type ViewProps } from "react-native";

import { Radius } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme";

type MaterialCardVariant = 'default' | 'elevated' | 'tinted' | 'outlined';

type MaterialCardProps = ViewProps & {
  variant?: MaterialCardVariant;
};

export function MaterialCard({
  children,
  style,
  variant = 'default',
  ...props
}: MaterialCardProps) {
  const colors = useColors();

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderAccent,
      shadowColor: colors.glowShadow,
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderAccent,
      shadowColor: colors.glowShadow,
      shadowOpacity: 1,
      shadowRadius: 20,
    },
    tinted: {
      backgroundColor: colors.surfaceTinted,
      borderWidth: 1,
      borderColor: colors.borderAccent,
      shadowColor: colors.glowShadow,
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.borderAccentStrong,
      shadowColor: colors.glowShadow,
      shadowOpacity: 1,
      shadowRadius: 16,
    },
  }[variant];

  return (
    <View
      style={[
        {
          borderRadius: Radius.lg,
          borderCurve: "continuous" as const,
          overflow: "hidden" as const,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
          ...variantStyles,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
