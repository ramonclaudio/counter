import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { Spacing, FontSize } from "@/constants/layout";
import { AnimationColors } from "@/constants/theme";

const AMBER = AnimationColors.search;
const AMBER_LIGHT = AnimationColors.searchLight;

function Dot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(0.6, { duration: 400 }),
        ),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function SearchIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </View>
        <Text style={styles.label}>Searching the web</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: AnimationColors.searchFill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AnimationColors.searchBorder,
  },
  label: {
    fontSize: FontSize.sm,
    color: AMBER_LIGHT,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AMBER,
  },
});
