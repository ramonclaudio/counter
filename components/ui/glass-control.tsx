import { View, type ViewProps } from "react-native";

import { Radius } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme";
import { useAccessibilitySettings } from "@/hooks/use-accessibility-settings";

let _glassModule: typeof import("expo-glass-effect") | null = null;
function getGlassModule() {
  if (_glassModule === null) {
    try {
      _glassModule = require("expo-glass-effect");
    } catch {
      _glassModule = null;
    }
  }
  return _glassModule;
}

function canUseGlass(): boolean {
  const glass = getGlassModule();
  if (!glass) return false;
  try {
    return glass.isLiquidGlassAvailable() && glass.isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

const baseCardStyle = {
  borderRadius: Radius.lg,
  borderCurve: "continuous" as const,
  overflow: "hidden" as const,
};

type GlassControlProps = ViewProps & {
  glassStyle?: "regular" | "clear";
  isInteractive?: boolean;
  tint?: string;
};

export function GlassControl({
  children,
  style,
  glassStyle = "regular",
  isInteractive = false,
  tint,
  ...props
}: GlassControlProps) {
  const colors = useColors();
  const { reduceTransparency } = useAccessibilitySettings();

  const fallbackBg = tint ?? colors.card;
  const cardStyle = [
    baseCardStyle,
    { backgroundColor: fallbackBg, borderWidth: tint ? 0 : 1, borderColor: colors.border },
    style,
  ];

  const glass = getGlassModule();
  if (glass && canUseGlass() && !reduceTransparency) {
    const { GlassView } = glass;
    return (
      <GlassView
        style={[baseCardStyle, { borderWidth: tint ? 0 : 1, borderColor: colors.border }, style]}
        glassEffectStyle={glassStyle}
        isInteractive={isInteractive}
        tintColor={tint}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

