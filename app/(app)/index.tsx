import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  SafeAreaView,
  Alert,
} from "react-native";
import { router } from "expo-router";
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
import { IntelCard } from "@/components/counter/intel-card";
import { PhaseBadge } from "@/components/counter/phase-badge";
import { SearchIndicator } from "@/components/counter/search-indicator";
import { Transcript } from "@/components/counter/transcript";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, TouchTarget, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";

const ORB_SIZE = 180;
const ORB_RING_SIZE = ORB_SIZE + 40;

// Blue shades for speaking color cycling
const SPEAK_COLORS = ["#0088FF", "#0099FF", "#00AAFF", "#0077EE", "#0055DD"];
const SEARCH_COLOR = "#F59E0B"; // amber

const DOT_COUNT = 5;
const DOT_ORBIT_RADIUS = ORB_RING_SIZE / 2 + 16;

function OrbDot({ index, total, rotate }: { index: number; total: number; rotate: Animated.SharedValue<number> }) {
  const angle = (2 * Math.PI * index) / total;
  const dotStyle = useAnimatedStyle(() => {
    const r = rotate.value;
    const a = angle + r;
    const x = Math.cos(a) * DOT_ORBIT_RADIUS;
    const y = Math.sin(a) * DOT_ORBIT_RADIUS;
    const trailFade = 0.4 + 0.6 * ((index / total + rotate.value / (2 * Math.PI)) % 1);
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: trailFade,
    };
  });
  return <Animated.View style={[styles.orbitDot, dotStyle]} />;
}

function Orb({
  isSpeaking,
  isConnected,
  isSearching,
}: {
  isSpeaking: boolean;
  isConnected: boolean;
  isSearching: boolean;
}) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.6);
  // 0=idle/listen, 1=speaking, 2=searching, 3=disconnected
  const orbMode = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const dotRotate = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      orbMode.value = 3;
      pulse.value = withSpring(1, { damping: 12 });
      ring.value = withTiming(0.3, { duration: 400 });
      colorProgress.value = 0;
    } else if (isSpeaking) {
      orbMode.value = 1;
      pulse.value = withRepeat(
        withSequence(
          withSpring(1.09, { damping: 6, stiffness: 140 }),
          withSpring(0.96, { damping: 6, stiffness: 140 }),
        ),
        -1,
        true,
      );
      ring.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.55, { duration: 500 }),
        ),
        -1,
        true,
      );
      colorProgress.value = withRepeat(
        withTiming(SPEAK_COLORS.length - 1, { duration: 2400, easing: Easing.linear }),
        -1,
        false,
      );
    } else if (isSearching) {
      orbMode.value = 2;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
          withTiming(0.98, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
        ),
        -1,
        true,
      );
      ring.value = withTiming(0.5, { duration: 300 });
      colorProgress.value = 0;
    } else {
      // Listening/connected: gentle breathing
      orbMode.value = 0;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
          withTiming(0.98, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
        ),
        -1,
        true,
      );
      ring.value = withTiming(0.75, { duration: 400 });
      colorProgress.value = 0;
    }
  }, [isSpeaking, isConnected, isSearching]);

  useEffect(() => {
    if (isSearching) {
      dotRotate.value = withRepeat(
        withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      dotRotate.value = withTiming(0, { duration: 300 });
    }
  }, [isSearching]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [{ scale: interpolate(ring.value, [0.3, 1], [0.95, 1.08]) }],
  }));

  // Color lookup table for worklet (no closure over JS vars)
  const orbColorStyle = useAnimatedStyle(() => {
    const mode = orbMode.value;
    if (mode === 3) return { backgroundColor: "#8E8E93", shadowOpacity: 0.15 };
    if (mode === 2) return { backgroundColor: SEARCH_COLOR, shadowOpacity: 0.5 };
    if (mode === 1) {
      // Interpolate across the SPEAK_COLORS palette
      const progress = colorProgress.value;
      const color = interpolateColor(
        progress,
        [0, 1, 2, 3, 4],
        SPEAK_COLORS,
      );
      return { backgroundColor: color, shadowOpacity: 0.65 };
    }
    return { backgroundColor: "#0088FF", shadowOpacity: 0.4 };
  });

  const ringColor = isSearching ? SEARCH_COLOR : isConnected ? "#0088FF" : "#8E8E93";
  const shadowColor = isSearching ? SEARCH_COLOR : "#0088FF";

  return (
    <View style={styles.orbContainer}>
      {isSearching &&
        Array.from({ length: DOT_COUNT }).map((_, i) => (
          <OrbDot key={i} index={i} total={DOT_COUNT} rotate={dotRotate} />
        ))}
      <Animated.View style={[styles.orbRing, ringStyle, { borderColor: ringColor }]} />
      <Animated.View
        style={[styles.orb, orbStyle, orbColorStyle, { shadowColor }]}
      />
    </View>
  );
}

export default function ConversationScreen() {
  const { startSession, endSession, toggleMicMuted, status, isSpeaking, intelCards, conversationPhase, isSearching, error, messages } =
    useCounter();
  const [micMuted, setMicMutedState] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<"intel" | "chat">("intel");
  const scrollRef = useRef<ScrollView>(null);
  const prevSearching = useRef(false);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  useEffect(() => {
    if (intelCards.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [intelCards.length]);

  // Haptic feedback when search starts: 3 quick light taps
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
      console.log("[Counter] Starting session...");
      await startSession();
      console.log("[Counter] Session started, status:", status);
    } catch (e) {
      console.error("[Counter] Start failed:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    haptics.medium();
    await endSession();
    setMicMutedState(false);
  };

  const handleMicToggle = () => {
    const next = !micMuted;
    setMicMutedState(next);
    toggleMicMuted(next);
    haptics.light();
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Counter</Text>
        <View style={styles.headerRight}>
          {isConnected && <PhaseBadge phase={conversationPhase} />}
          <Pressable
            onPress={() => router.push("/(app)/history")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="View history"
          >
            <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
          </Pressable>
        </View>
      </View>

      {/* Orb area */}
      <View style={styles.orbArea}>
        <Orb isSpeaking={isSpeaking} isConnected={isConnected} isSearching={isSearching} />
        {!isConnected && !isConnecting && (
          <Text style={styles.tagline}>AI deal intelligence, in your corner.</Text>
        )}
        {isConnecting && (
          <Text style={styles.connectingLabel}>Connecting...</Text>
        )}
        {isConnected && !isSpeaking && !isSearching && (
          <Text style={styles.connectingLabel}>Listening...</Text>
        )}
        {isConnected && isSpeaking && (
          <Text style={styles.connectingLabel}>Speaking...</Text>
        )}
        {error && (
          <Text style={[styles.connectingLabel, { color: Colors.systemRed as string }]}>{error}</Text>
        )}
        <SearchIndicator visible={isSearching} />
      </View>

      {/* Content area (intel / chat) */}
      {isConnected && (
        <View style={styles.contentArea}>
          {/* Tab toggle */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tab, activeTab === "intel" && styles.tabActive]}
              onPress={() => { setActiveTab("intel"); haptics.selection(); }}
            >
              <Text style={[styles.tabLabel, activeTab === "intel" && styles.tabLabelActive]}>Intel</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "chat" && styles.tabActive]}
              onPress={() => { setActiveTab("chat"); haptics.selection(); }}
            >
              <Text style={[styles.tabLabel, activeTab === "chat" && styles.tabLabelActive]}>Chat</Text>
            </Pressable>
          </View>

          {activeTab === "intel" ? (
            <ScrollView
              ref={scrollRef}
              style={styles.cardsScroll}
              contentContainerStyle={styles.cardsContent}
              showsVerticalScrollIndicator={false}
            >
              {intelCards.length === 0 && !isSearching && (
                <Text style={styles.emptyHint}>
                  Tell me what you're buying. I'll find everything you need to know.
                </Text>
              )}
              {intelCards.map((card) => (
                <IntelCard key={card.id} card={card} />
              ))}
            </ScrollView>
          ) : (
            <Transcript messages={messages} />
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isConnected && !isConnecting ? (
          <Pressable
            style={[styles.startButton, isStarting && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityLabel="Start conversation"
          >
            <IconSymbol name="mic.fill" size={IconSize["2xl"]} color="#FFFFFF" />
            <Text style={styles.startLabel}>{isStarting ? "Connecting..." : "Start"}</Text>
          </Pressable>
        ) : (
          <View style={styles.sessionControls}>
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
              <IconSymbol name="phone.down.fill" size={IconSize.xl} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  wordmark: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
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
  connectingLabel: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  contentArea: {
    flex: 1,
    maxHeight: 360,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.secondarySystemFill as string,
    borderRadius: Radius.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    alignItems: "center",
    borderRadius: Radius.md + 2,
  },
  tabActive: {
    backgroundColor: Colors.background as string,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.mutedForeground as string,
  },
  tabLabelActive: {
    color: Colors.foreground as string,
    fontWeight: "600",
  },
  cardsScroll: {
    flex: 1,
  },
  cardsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    textAlign: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
  },
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
    color: "#FFFFFF",
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
    backgroundColor: Colors.destructiveFill as string,
    borderColor: Colors.destructiveBorder as string,
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
});
