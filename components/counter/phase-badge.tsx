import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, PhaseColors } from "@/constants/theme";
import { Spacing, FontSize, IconSize, FontFamily } from "@/constants/layout";
import { Spring } from "@/constants/motion";
import type { ConversationPhase, SessionMode } from "@/lib/types";

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
    color: PhaseColors.research,
  },
  coach: {
    label: "Coach",
    icon: "person.fill",
    color: PhaseColors.coach,
  },
  advisor: {
    label: "Live Advisor",
    icon: "bolt.fill",
    color: PhaseColors.advisor,
  },
};

const LIVE_RED = "#EF4444";
const PRACTICE_PURPLE = "#8B5CF6";

type Props = {
  phase: ConversationPhase;
  mode?: SessionMode;
};

function LiveDot() {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

export function PhaseBadge({ phase, mode }: Props) {
  const config = PHASE_CONFIG[phase];
  const scale = useSharedValue(1);
  const isLive = mode === "live";
  const isPractice = mode === "practice";
  const borderColor = isLive ? LIVE_RED : config.color;

  useEffect(() => {
    scale.value = withSpring(1.08, Spring.snappy, () => {
      scale.value = withSpring(1, Spring.snappy);
    });
  }, [phase, mode]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} accessibilityLiveRegion="polite">
      <View style={[styles.badge, { borderColor }]}>
        {isLive && (
          <>
            <LiveDot />
            <Text style={[styles.label, { color: LIVE_RED }]}>LIVE</Text>
            <View style={styles.separator} />
          </>
        )}
        {isPractice && (
          <>
            <Text style={[styles.label, { color: PRACTICE_PURPLE }]}>Practice</Text>
            <View style={styles.separator} />
          </>
        )}
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
    fontFamily: FontFamily.semiBold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIVE_RED,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: Colors.mutedForeground as string,
    opacity: 0.3,
  },
});
