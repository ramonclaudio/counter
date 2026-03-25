import { Text, type TextProps, type TextStyle, type ColorValue } from "react-native";

import { Accessibility } from "@/constants/ui";
import { FontFamily } from "@/constants/layout";
import { Typography } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme";
import { useAccessibilitySettings } from "@/hooks/use-accessibility-settings";

type ThemedTextProps = TextProps & {
  variant?: keyof typeof Typography;
  color?: ColorValue;
};

const BOLD_FAMILY_MAP: Record<string, string> = {
  [FontFamily.regular]: FontFamily.medium,
  [FontFamily.medium]: FontFamily.semiBold,
  [FontFamily.semiBold]: FontFamily.bold,
  [FontFamily.bold]: FontFamily.extraBold,
  [FontFamily.extraBold]: FontFamily.black,
  [FontFamily.black]: FontFamily.black,
  [FontFamily.mono]: FontFamily.monoMedium,
  [FontFamily.monoMedium]: FontFamily.monoBold,
  [FontFamily.monoBold]: FontFamily.monoBold,
};

export function ThemedText({ style, variant = "default", color, ...props }: ThemedTextProps) {
  const colors = useColors();
  const { boldText } = useAccessibilitySettings();

  const variantStyle = Typography[variant] as TextStyle;
  const baseFamily = variantStyle.fontFamily ?? FontFamily.regular;
  const adjustedFamily = boldText ? (BOLD_FAMILY_MAP[baseFamily] ?? FontFamily.bold) : baseFamily;

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={Accessibility.maxFontSizeMultiplier}
      style={[variantStyle, { color: color ?? colors.text, fontFamily: adjustedFamily }, style]}
      {...props}
    />
  );
}
