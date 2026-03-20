import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { Colors } from "@/constants/theme";
import { Spacing, FontSize } from "@/constants/layout";

type Props = {
  visible: boolean;
};

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.dot, animatedStyle, { marginLeft: delay > 0 ? 4 : 0 }]}
    />
  );
}

export function SearchIndicator({ visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Searching the web</Text>
      <View style={styles.dots}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground as string,
    fontStyle: "italic",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.mutedForeground as string,
  },
});
