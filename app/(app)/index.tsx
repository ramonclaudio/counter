import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { useCounter } from "@/hooks/use-counter";
import { MiniOrb } from "@/components/counter/mini-orb";
import { FeedItemView } from "@/components/counter/feed-item";
import { PhaseBadge } from "@/components/counter/phase-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, AnimationColors } from "@/constants/theme";
import { Spacing, FontSize, TouchTarget, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";

const ORB_SIZE = 180;
const ORB_RING_SIZE = ORB_SIZE + 40;
const SPEAK_COLORS = AnimationColors.speaking;
const SEARCH_COLOR = AnimationColors.search;
const DOT_COUNT = 5;
const DOT_ORBIT_RADIUS = ORB_RING_SIZE / 2 + 16;

function OrbDot({ index, total, rotate }: { index: number; total: number; rotate: import("react-native-reanimated").SharedValue<number> }) {
  const angle = (2 * Math.PI * index) / total;
  const dotStyle = useAnimatedStyle(() => {
    const a = angle + rotate.value;
    return {
      transform: [{ translateX: Math.cos(a) * DOT_ORBIT_RADIUS }, { translateY: Math.sin(a) * DOT_ORBIT_RADIUS }],
      opacity: 0.4 + 0.6 * ((index / total + rotate.value / (2 * Math.PI)) % 1),
    };
  });
  return <Animated.View style={[styles.orbitDot, dotStyle]} />;
}

function Orb({ isSpeaking, isConnected, isSearching }: { isSpeaking: boolean; isConnected: boolean; isSearching: boolean }) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.6);
  const orbMode = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const dotRotate = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      orbMode.value = 3;
      pulse.value = withSpring(1, { damping: 12 });
      ring.value = withTiming(0.3, { duration: 400 });
      colorProgress.value = 0;
    } else if (isSearching) {
      orbMode.value = 2;
      pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) }), withTiming(0.98, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) })), -1, true);
      ring.value = withTiming(0.5, { duration: 300 });
      colorProgress.value = 0;
    } else if (isSpeaking) {
      orbMode.value = 1;
      pulse.value = withRepeat(withSequence(withSpring(1.09, { damping: 6, stiffness: 140 }), withSpring(0.96, { damping: 6, stiffness: 140 })), -1, true);
      ring.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.55, { duration: 500 })), -1, true);
      colorProgress.value = withRepeat(withTiming(SPEAK_COLORS.length - 1, { duration: 2400, easing: Easing.linear }), -1, false);
    } else {
      orbMode.value = 0;
      pulse.value = withRepeat(withSequence(withTiming(1.02, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), withTiming(0.98, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) })), -1, true);
      ring.value = withTiming(0.75, { duration: 400 });
      colorProgress.value = 0;
    }
  }, [isSpeaking, isConnected, isSearching]);

  useEffect(() => {
    dotRotate.value = isSearching
      ? withRepeat(withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }), -1, false)
      : withTiming(0, { duration: 300 });
  }, [isSearching]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value, transform: [{ scale: interpolate(ring.value, [0.3, 1], [0.95, 1.08]) }] }));
  const orbColorStyle = useAnimatedStyle(() => {
    const mode = orbMode.value;
    if (mode === 3) return { backgroundColor: Colors.systemGray as string, shadowOpacity: 0.15 };
    if (mode === 2) return { backgroundColor: SEARCH_COLOR, shadowOpacity: 0.5 };
    if (mode === 1) return { backgroundColor: interpolateColor(colorProgress.value, [0, 1, 2, 3, 4], SPEAK_COLORS), shadowOpacity: 0.65 };
    return { backgroundColor: Colors.primary as string, shadowOpacity: 0.4 };
  });

  const ringColor = isSearching ? SEARCH_COLOR : isConnected ? (Colors.primary as string) : (Colors.systemGray as string);
  const shadowColor = isSearching ? SEARCH_COLOR : (Colors.primary as string);

  return (
    <View style={styles.orbContainer}>
      {isSearching && Array.from({ length: DOT_COUNT }).map((_, i) => <OrbDot key={i} index={i} total={DOT_COUNT} rotate={dotRotate} />)}
      <Animated.View style={[styles.orbRing, ringStyle, { borderColor: ringColor }]} />
      <Animated.View style={[styles.orb, orbStyle, orbColorStyle, { shadowColor }]} />
    </View>
  );
}

const SUGGESTIONS = [
  "Looking for a laptop",
  "Car shopping",
  "Negotiating rent",
  "Best phone deals",
];

function FeedEmptyState({ onSuggestion }: { onSuggestion?: (text: string) => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={styles.emptyHint}>
        Tell me what you're buying. I'll find everything you need to know.
      </Text>
      <View style={styles.suggestionsRow}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            style={styles.suggestionChip}
            onPress={() => onSuggestion?.(s)}
            accessibilityRole="button"
            accessibilityLabel={s}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export default function ConversationScreen() {
  const { startSession, endSession, toggleMicMuted, status, isSpeaking, conversationPhase, isSearching, error, feedItems } =
    useCounter();
  const [micMuted, setMicMutedState] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [lastSessionFeed, setLastSessionFeed] = useState<typeof feedItems>([]);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const prevSearching = useRef(false);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  // Session-ended entrance animation
  const sessionEndOpacity = useSharedValue(0);
  const sessionEndTranslate = useSharedValue(20);

  useEffect(() => {
    if (!isConnected && !isConnecting && lastSessionFeed.length > 0) {
      sessionEndOpacity.value = withTiming(1, { duration: 400 });
      sessionEndTranslate.value = withSpring(0, { damping: 20, stiffness: 180 });
    } else {
      sessionEndOpacity.value = 0;
      sessionEndTranslate.value = 20;
    }
  }, [isConnected, isConnecting, lastSessionFeed.length]);

  const sessionEndStyle = useAnimatedStyle(() => ({
    opacity: sessionEndOpacity.value,
    transform: [{ translateY: sessionEndTranslate.value }],
  }));

  useEffect(() => {
    if (feedItems.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
      setLastSessionFeed(feedItems);
    }
  }, [feedItems.length]);

  useEffect(() => {
    if (feedItems.length > 0) setLastSessionFeed(feedItems);
  }, [feedItems]);

  useEffect(() => {
    if (isSearching && !prevSearching.current) {
      haptics.light();
      setTimeout(() => haptics.light(), 100);
      setTimeout(() => haptics.light(), 200);
    }
    prevSearching.current = isSearching;
  }, [isSearching]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startSession();
    } catch (e) {
      console.error("[Counter] Start failed:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    haptics.medium();
    const cardCount = feedItems.filter(f => f.type === 'intel').reduce((sum, f) => sum + (f.type === 'intel' ? f.cards.length : 0), 0);
    setSessionSummary(cardCount > 0 ? `${cardCount} intel cards found` : 'Session ended');
    await endSession();
    setMicMutedState(false);
  };

  const handleMicToggle = () => {
    const next = !micMuted;
    setMicMutedState(next);
    toggleMicMuted(next);
    haptics.light();
  };

  const dismissSession = () => {
    setLastSessionFeed([]);
    setSessionSummary(null);
  };

  // --- Disconnected / Connecting ---
  if (!isConnected && !isConnecting) {
    if (lastSessionFeed.length > 0) {
      const cardCount = lastSessionFeed.filter(f => f.type === 'intel').reduce((sum, f) => sum + (f.type === 'intel' ? f.cards.length : 0), 0);
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.header}>
            <Text style={styles.wordmark}>Counter</Text>
            <Pressable onPress={() => router.push("/(app)/history")} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
              <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
            </Pressable>
          </View>
          <View style={styles.orbArea}>
            <Animated.View style={[{ alignItems: "center", gap: Spacing.lg }, sessionEndStyle]}>
              <View style={styles.sessionEndBanner}>
                <IconSymbol name="checkmark.circle.fill" size={IconSize["2xl"]} color={Colors.success as string} />
                <Text style={styles.sessionEndTitle}>Session ended</Text>
                {sessionSummary && <Text style={styles.sessionEndSubtitle}>{sessionSummary}</Text>}
                {cardCount > 0 && <Text style={styles.sessionEndSubtitle}>{cardCount} {cardCount === 1 ? 'card' : 'cards'} saved</Text>}
              </View>
              <Pressable
                style={styles.startButton}
                onPress={() => { dismissSession(); handleStart(); }}
                accessibilityRole="button"
                accessibilityLabel="Start new session"
              >
                <IconSymbol name="mic.fill" size={IconSize["2xl"]} color={Colors.onColor} />
                <Text style={styles.startLabel}>New Session</Text>
              </Pressable>
              <Text style={styles.sessionEndFollow}>Try asking about alternatives or price history</Text>
              <Pressable onPress={dismissSession} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss">
                <Text style={styles.dismissLabel}>Dismiss</Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Counter</Text>
          <Pressable onPress={() => router.push("/(app)/history")} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
            <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
          </Pressable>
        </View>
        <View style={styles.orbArea}>
          <Orb isSpeaking={false} isConnected={false} isSearching={false} />
          <Text style={styles.tagline}>AI deal intelligence, in your corner.</Text>
          {error && <Text style={[styles.statusLabel, { color: Colors.systemRed as string }]}>{error}</Text>}
        </View>
        <View style={styles.controls}>
          <Pressable
            style={[styles.startButton, isStarting && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityLabel="Start conversation"
          >
            <IconSymbol name="mic.fill" size={IconSize["2xl"]} color={Colors.onColor} />
            <Text style={styles.startLabel}>{isStarting ? "Connecting..." : "Start"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Counter</Text>
        </View>
        <View style={styles.orbArea}>
          <Orb isSpeaking={false} isConnected={true} isSearching={false} />
          <Text style={styles.statusLabel}>Connecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Connected: feed layout ---
  return (
    <SafeAreaView style={styles.root}>
      {/* Ambient gradient backdrop */}
      <LinearGradient
        colors={["transparent", "rgba(0,136,255,0.04)", "rgba(0,136,255,0.02)", "transparent"]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header with mini orb */}
      <View style={styles.headerConnected}>
        <Text style={styles.wordmark}>Counter</Text>
        <View style={styles.headerCenter}>
          <MiniOrb isSpeaking={isSpeaking} isConnected={isConnected} isSearching={isSearching} />
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push("/(app)/history")} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
            <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
          </Pressable>
        </View>
      </View>

      {/* Phase strip */}
      <View style={styles.phaseStrip}>
        <PhaseBadge phase={conversationPhase} />
      </View>

      {/* Status bar */}
      {error && (
        <View style={styles.statusBar}>
          <Text style={[styles.statusLabel, { color: Colors.systemRed as string }]}>{error}</Text>
        </View>
      )}

      {/* Feed */}
      <ScrollView
        ref={scrollRef}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {feedItems.length === 0 && !isSearching && <FeedEmptyState />}
        {feedItems.map((item, i) => (
          <FeedItemView key={i} item={item} />
        ))}
        {isSearching && <FeedItemView item={{ type: 'searching', timestamp: Date.now() }} />}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.sessionControls}>
          <Pressable
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Text input (coming soon)"
          >
            <IconSymbol
              name="keyboard"
              size={IconSize.xl}
              color={Colors.tertiaryLabel as string}
            />
          </Pressable>
          <Pressable
            style={[styles.iconButton, micMuted && styles.iconButtonActive]}
            onPress={handleMicToggle}
            accessibilityRole="button"
            accessibilityLabel={micMuted ? "Unmute microphone" : "Mute microphone"}
          >
            <IconSymbol
              name={micMuted ? "mic.slash.fill" : "mic.fill"}
              size={IconSize.xl}
              color={micMuted ? (Colors.systemRed as string) : (Colors.foreground as string)}
            />
          </Pressable>
          <Pressable
            style={styles.endButton}
            onPress={handleEnd}
            accessibilityRole="button"
            accessibilityLabel="End conversation"
          >
            <IconSymbol name="phone.down.fill" size={IconSize.xl} color={Colors.onColor} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  // --- Header ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerConnected: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    minHeight: 82,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  phaseStrip: {
    alignItems: "center",
    paddingVertical: Spacing.xxs,
  },
  wordmark: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.5,
    zIndex: 1,
  },
  // --- Orb area (disconnected) ---
  orbArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  orbContainer: {
    width: ORB_RING_SIZE + 40,
    height: ORB_RING_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  orbRing: {
    position: "absolute",
    width: ORB_RING_SIZE,
    height: ORB_RING_SIZE,
    borderRadius: ORB_RING_SIZE / 2,
    borderWidth: 1.5,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 42,
    elevation: 14,
  },
  orbitDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SEARCH_COLOR,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
    textAlign: "center",
    paddingHorizontal: Spacing["4xl"],
    lineHeight: 22,
  },
  statusLabel: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  statusBar: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  // --- Feed (connected) ---
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    textAlign: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing["2xl"],
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border as string,
    backgroundColor: Colors.card as string,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.foreground as string,
    fontWeight: "500",
  },
  // --- Controls ---
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
    paddingTop: Spacing.md,
    alignItems: "center",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary as string,
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    shadowColor: Colors.primary as string,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 160,
    justifyContent: "center",
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startLabel: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    color: Colors.onColor,
    letterSpacing: 0.3,
  },
  sessionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["2xl"],
  },
  iconButton: {
    width: TouchTarget.min + 8,
    height: TouchTarget.min + 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.card as string,
    borderWidth: 1,
    borderColor: Colors.border as string,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: Colors.destructiveFill as unknown as string,
    borderColor: Colors.destructiveBorder as unknown as string,
  },
  endButton: {
    width: TouchTarget.min + 16,
    height: TouchTarget.min + 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.systemRed as string,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.systemRed as string,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  sessionEndBanner: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  sessionEndTitle: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    color: Colors.foreground as string,
  },
  sessionEndSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground as string,
  },
  sessionEndFollow: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  dismissLabel: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
    paddingVertical: Spacing.md,
  },
});
