import { Text, type TextProps, type TextStyle, type ColorValue } from "react-native";

import { Accessibility } from "@/constants/ui";
import { Typography } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme";
import { useAccessibilitySettings } from "@/hooks/use-accessibility-settings";

type FontWeight = TextStyle["fontWeight"];

type ThemedTextProps = TextProps & {
  variant?: keyof typeof Typography;
  color?: ColorValue;
};

const BOLD_WEIGHT_MAP: Record<string, FontWeight> = {
  "100": "400",
  "200": "500",
  "300": "600",
  "400": "700",
  "500": "800",
  "600": "900",
  "700": "900",
  "800": "900",
  "900": "900",
  normal: "700",
  bold: "900",
};

export function ThemedText({ style, variant = "default", color, ...props }: ThemedTextProps) {
  const colors = useColors();
  const { boldText } = useAccessibilitySettings();

  const variantStyle = Typography[variant] as TextStyle;
  const baseWeight = variantStyle.fontWeight ?? "400";
  const adjustedWeight = boldText ? (BOLD_WEIGHT_MAP[String(baseWeight)] ?? "700") : baseWeight;

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={Accessibility.maxFontSizeMultiplier}
      style={[variantStyle, { color: color ?? colors.text, fontWeight: adjustedWeight }, style]}
      {...props}
    />
  );
}
