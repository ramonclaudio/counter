import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, IconSize } from "@/constants/layout";
import { Spring } from "@/constants/motion";
import type { ConversationPhase } from "@/lib/types";

const PHASE_CONFIG: Record<
  ConversationPhase,
  { label: string; icon: string; color: string }
> = {
  idle: {
    label: "Ready",
    icon: "waveform",
    color: Colors.mutedForeground as string,
  },
  research: {
    label: "Research",
    icon: "magnifyingglass",
    color: Colors.systemBlue as string,
  },
  coach: {
    label: "Coach",
    icon: "person.fill",
    color: Colors.systemGreen as string,
  },
  advisor: {
    label: "Live Advisor",
    icon: "bolt.fill",
    color: Colors.systemOrange as string,
  },
};

type Props = {
  phase: ConversationPhase;
};

export function PhaseBadge({ phase }: Props) {
  const config = PHASE_CONFIG[phase];
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.08, Spring.snappy, () => {
      scale.value = withSpring(1, Spring.snappy);
    });
  }, [phase]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} accessibilityLiveRegion="polite">
      <View style={[styles.badge, { borderColor: config.color }]}>
        <IconSymbol name={config.icon} size={IconSize.sm} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.card as string,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
