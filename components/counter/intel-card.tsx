import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";

import { MaterialCard } from "@/components/ui/material-card";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, LineHeight } from "@/constants/layout";
import type { IntelCard as IntelCardType } from "@/lib/types";

const TYPE_CONFIG = {
  price: {
    color: Colors.systemGreen,
    label: "Price",
    icon: "$",
  },
  warning: {
    color: Colors.systemRed,
    label: "Warning",
    icon: "!",
  },
  alternative: {
    color: Colors.systemBlue,
    label: "Alternative",
    icon: "~",
  },
  leverage: {
    color: Colors.systemYellow,
    label: "Leverage",
    icon: "^",
  },
} as const;

type Props = {
  card: IntelCardType;
};

export function IntelCard({ card }: Props) {
  const config = TYPE_CONFIG[card.type];
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 250 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleSourcePress = () => {
    if (card.sourceUrl) Linking.openURL(card.sourceUrl);
  };

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCard style={styles.card}>
        <View style={[styles.accent, { backgroundColor: config.color as string }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.typeBadge, { borderColor: config.color as string }]}>
              <Text style={[styles.typeLabel, { color: config.color as string }]}>
                {config.label}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {card.title}
            </Text>
          </View>
          <Text style={styles.value}>{card.value}</Text>
          {card.sourceUrl ? (
            <Pressable onPress={handleSourcePress} hitSlop={8}>
              <Text style={styles.source} numberOfLines={1}>
                {card.source}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.source} numberOfLines={1}>
              {card.source}
            </Text>
          )}
        </View>
      </MaterialCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  accent: {
    width: 4,
    borderRadius: Radius.sm,
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.foreground as string,
    lineHeight: LineHeight.base,
  },
  value: {
    fontSize: FontSize.md,
    color: Colors.mutedForeground as string,
    lineHeight: LineHeight.base,
  },
  source: {
    fontSize: FontSize.xs,
    color: Colors.link as string,
  },
});
