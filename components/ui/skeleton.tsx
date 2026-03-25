import { useEffect, useRef } from "react";
import { View, Animated, type ViewStyle, type StyleProp, type DimensionValue } from "react-native";
import { useColors } from "@/hooks/use-theme";
import { Spacing, FontSize } from "@/constants/layout";
import { Radius } from "@/constants/theme";

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = Radius.sm,
  style,
}: SkeletonProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: colors.muted,
  };

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        baseStyle,
        { opacity },
        style,
      ]}
    />
  );
}

