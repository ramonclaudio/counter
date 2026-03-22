import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
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
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useCounter } from "@/hooks/use-counter";
import { MiniOrb } from "@/components/counter/mini-orb";
import { FeedItemView } from "@/components/counter/feed-item";
import { PhaseBadge } from "@/components/counter/phase-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, AnimationColors, PhaseColors, PhaseGradients, Overlay } from "@/constants/theme";
import { Spacing, FontSize, TouchTarget, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";
import { MODE_CONFIGS } from "@/constants/modes";
import type { ConversationPhase, IntelCard, FeedItem, SessionMode } from "@/lib/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning. What deal are you chasing?";
  if (hour < 17) return "Good afternoon. What are you shopping for?";
  if (hour < 21) return "Good evening. Looking for a deal?";
  return "Late night shopping? Let's find a deal.";
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Orb ---

const ORB_SIZE = 180;
const ORB_RING_SIZE = ORB_SIZE + 40;
const IMMERSIVE_ORB_SIZE = 240;
const IMMERSIVE_RING_SIZE = IMMERSIVE_ORB_SIZE + 50;
const SEARCH_COLOR = AnimationColors.search;
const DOT_COUNT = 5;
const DOT_ORBIT_RADIUS = ORB_RING_SIZE / 2 + 16;

function getPhaseColors(phase: ConversationPhase): readonly string[] {
  return AnimationColors[phase === "idle" ? "speaking" : phase] ?? AnimationColors.speaking;
}

function getPhaseBaseColor(phase: ConversationPhase): string {
  return PhaseColors[phase];
}

function getPhaseGradient(phase: ConversationPhase): [string, string, string, string] {
  return PhaseGradients[phase] ?? PhaseGradients.idle;
}

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

function Orb({ isSpeaking, isConnected, isSearching, phase = "idle", size = "normal" }: {
  isSpeaking: boolean; isConnected: boolean; isSearching: boolean;
  phase?: ConversationPhase; size?: "normal" | "immersive";
}) {
  const isImmersive = size === "immersive";
  const orbSize = isImmersive ? IMMERSIVE_ORB_SIZE : ORB_SIZE;
  const ringSize = isImmersive ? IMMERSIVE_RING_SIZE : ORB_RING_SIZE;

  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.6);
  const orbMode = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const dotRotate = useSharedValue(0);

  const speakColors = getPhaseColors(phase);
  const baseColor = getPhaseBaseColor(phase);

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
      const springConfig = isImmersive ? { damping: 5, stiffness: 120 } : { damping: 6, stiffness: 140 };
      pulse.value = withRepeat(withSequence(withSpring(isImmersive ? 1.12 : 1.09, springConfig), withSpring(isImmersive ? 0.93 : 0.96, springConfig)), -1, true);
      ring.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.55, { duration: 500 })), -1, true);
      colorProgress.value = withRepeat(withTiming(speakColors.length - 1, { duration: 2400, easing: Easing.linear }), -1, false);
    } else {
      orbMode.value = 0;
      pulse.value = withRepeat(withSequence(withTiming(1.02, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), withTiming(0.98, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) })), -1, true);
      ring.value = withTiming(0.75, { duration: 400 });
      colorProgress.value = 0;
    }
  }, [isSpeaking, isConnected, isSearching, phase]);

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
    if (mode === 1) return { backgroundColor: interpolateColor(colorProgress.value, speakColors.map((_, i) => i), [...speakColors]), shadowOpacity: isImmersive ? 0.8 : 0.65 };
    return { backgroundColor: baseColor, shadowOpacity: 0.4 };
  });

  const ringColor = isSearching ? SEARCH_COLOR : isConnected ? baseColor : (Colors.systemGray as string);
  const shadowColor = isSearching ? SEARCH_COLOR : baseColor;

  return (
    <View style={[styles.orbContainer, { width: ringSize + 40, height: ringSize + 40 }]}>
      {isSearching && Array.from({ length: DOT_COUNT }).map((_, i) => <OrbDot key={i} index={i} total={DOT_COUNT} rotate={dotRotate} />)}
      <Animated.View style={[styles.orbRing, ringStyle, { borderColor: ringColor, width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]} />
      <Animated.View style={[styles.orb, orbStyle, orbColorStyle, { shadowColor, width: orbSize, height: orbSize, borderRadius: orbSize / 2 }]} />
    </View>
  );
}

// --- Categories ---

const CATEGORIES = [
  { icon: "desktopcomputer", label: "Electronics", greeting: "Hey! What electronics are you looking at? Tell me the product and I'll dig up the best prices, alternatives, and any deals running right now.", context: "The user is shopping for electronics (laptops, phones, TVs, headphones, etc). Focus on price comparisons across retailers, refurbished options, upcoming sales, and spec-for-spec alternatives. Check Best Buy, Amazon, Walmart, B&H, and manufacturer direct." },
  { icon: "car.fill", label: "Auto", greeting: "Car shopping? Nice. Tell me what you're looking at, whether you're buying new or used, and I'll pull pricing data, incentives, and negotiation leverage.", context: "The user is car shopping or negotiating an auto deal. Focus on fair market pricing (KBB, Edmunds), dealer invoice vs MSRP, current incentives/rebates, financing rates, and negotiation leverage points. Check for recalls and reliability data." },
  { icon: "house.fill", label: "Home", greeting: "Looking to upgrade the space? Tell me what home items you need and I'll compare prices, check seasonal timing, and find the best options.", context: "The user is shopping for home goods (furniture, appliances, home improvement). Focus on price comparisons, seasonal sale timing, warranty options, and quality alternatives. Check Wayfair, Home Depot, IKEA, and specialty retailers." },
  { icon: "tshirt.fill", label: "Fashion", greeting: "Let's find you a deal on something stylish. What brands or pieces are you eyeing? I'll check for sales, coupon codes, and resale options.", context: "The user is looking for fashion deals. Focus on current sales, coupon codes, outlet alternatives, resale market prices, and upcoming seasonal markdowns. Check brand direct, Nordstrom Rack, SSENSE, and resale platforms." },
  { icon: "airplane", label: "Travel", greeting: "Where are you headed? Give me the dates and destination and I'll compare fares, check points options, and find the best booking window.", context: "The user is looking for travel deals (flights, hotels, packages). Focus on fare comparisons, flexible date pricing, points/miles optimization, and booking timing. Check Google Flights, Kayak, direct airline/hotel sites, and credit card travel portals." },
  { icon: "cart.fill", label: "Groceries", greeting: "Let's save on groceries. What are you stocking up on? I'll compare store prices, check weekly ads, and find the best bulk deals.", context: "The user wants to save on groceries. Focus on store price comparisons, current weekly ads, bulk buying value, store brand vs name brand, and cashback/coupon stacking. Check local grocery chains, Costco, Amazon Fresh, and Instacart." },
] as const;

const SUGGESTIONS = [
  "Looking for a laptop",
  "Car shopping",
  "Negotiating rent",
  "Best phone deals",
];

// --- Post-session summary helpers ---

function getSessionStats(feed: FeedItem[]) {
  const allCards: IntelCard[] = [];
  for (const item of feed) {
    if (item.type === "intel") allCards.push(...item.cards);
  }
  const priceCount = allCards.filter(c => c.type === "price").length;
  const warningCount = allCards.filter(c => c.type === "warning").length;
  const altCount = allCards.filter(c => c.type === "alternative").length;
  const leverageCount = allCards.filter(c => c.type === "leverage").length;
  const bestPrice = allCards.find(c => c.type === "price");
  return { total: allCards.length, priceCount, warningCount, altCount, leverageCount, bestPrice };
}

const FOLLOWUP_SUGGESTIONS = [
  "Compare with other stores",
  "Check return policies",
  "Find cheaper alternatives",
  "Get price history",
];

function buildSessionContext(feed: FeedItem[], followUp: string): string {
  const stats = getSessionStats(feed);
  const parts: string[] = [];
  parts.push(`The user just completed a session. They want to follow up: "${followUp}".`);
  if (stats.total > 0) {
    parts.push(`Previous session found ${stats.total} intel cards:`);
    const allCards: IntelCard[] = [];
    for (const item of feed) {
      if (item.type === "intel") allCards.push(...item.cards);
    }
    for (const card of allCards.slice(0, 6)) {
      const price = card.prices?.[0] ? ` at ${card.prices[0]}` : "";
      parts.push(`- [${card.type}] ${card.title}${price} (source: ${card.source})`);
    }
  }
  const userMsgs = feed
    .filter((f): f is Extract<FeedItem, { type: "user-message" }> => f.type === "user-message")
    .map(f => f.message.content);
  if (userMsgs.length > 0) {
    parts.push(`User was asking about: ${userMsgs[0]}`);
  }
  return parts.join("\n");
}

// --- Components ---

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
            onPress={() => { haptics.light(); onSuggestion?.(s); }}
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

function ImmersiveVoiceOverlay({ isSpeaking, isSearching, phase, mode, micMuted, onMicToggle, onEnd, onDismiss }: {
  isSpeaking: boolean; isSearching: boolean; phase: ConversationPhase; mode: SessionMode;
  micMuted: boolean; onMicToggle: () => void; onEnd: () => void; onDismiss: () => void;
}) {
  const gradient = getPhaseGradient(phase);
  return (
    <Animated.View
      style={styles.immersiveOverlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <LinearGradient
        colors={[Overlay.dark, gradient[1], gradient[2], Overlay.darker]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Pressable style={styles.immersiveDismiss} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Exit immersive mode">
        <IconSymbol name="chevron.down" size={IconSize.xl} color={Overlay.onDarkQuaternary} />
      </Pressable>
      <View style={styles.immersiveCenter}>
        <Orb isSpeaking={isSpeaking} isConnected isSearching={isSearching} phase={phase} size="immersive" />
        <Text style={styles.immersivePhase}>
          {mode === "live" ? "LIVE" : mode === "practice" ? "Practice" : phase === "research" ? "Researching" : phase === "coach" ? "Coaching" : phase === "advisor" ? "Advising" : "Listening"}
        </Text>
        {mode === "live" && <Text style={styles.immersiveLiveHint}>Listening to your negotiation</Text>}
      </View>
      <View style={styles.immersiveControls}>
        <Pressable
          style={[styles.immersiveButton, micMuted && styles.immersiveButtonActive]}
          onPress={onMicToggle}
          accessibilityRole="button"
        >
          <IconSymbol name={micMuted ? "mic.slash.fill" : "mic.fill"} size={IconSize["3xl"]} color={Overlay.onDark} />
          <Text style={styles.immersiveButtonLabel}>{micMuted ? "Unmute" : "Mute"}</Text>
        </Pressable>
        <Pressable style={styles.immersiveEndButton} onPress={onEnd} accessibilityRole="button">
          <IconSymbol name="phone.down.fill" size={IconSize["3xl"]} color={Overlay.onDark} />
          <Text style={styles.immersiveButtonLabel}>End</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function PostSessionSummary({ feed, onNewSession, onDismiss, onFollowUp, onFeedback }: {
  feed: FeedItem[]; onNewSession: () => void; onDismiss: () => void; onFollowUp: (q: string) => void;
  onFeedback?: (liked: boolean) => void;
}) {
  const stats = getSessionStats(feed);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ScrollView contentContainerStyle={styles.postSessionContent} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <IconSymbol name="checkmark.circle.fill" size={IconSize["4xl"]} color={Colors.success as string} />
          <Text style={styles.summaryTitle}>Session complete</Text>
          {stats.total > 0 && (
            <Text style={styles.summarySubtitle}>{stats.total} intel {stats.total === 1 ? "card" : "cards"} collected</Text>
          )}
          {/* Stats row */}
          {stats.total > 0 && (
            <View style={styles.statsRow}>
              {stats.priceCount > 0 && (
                <View style={styles.statChip}>
                  <IconSymbol name="tag.fill" size={12} color={Colors.systemGreen as string} />
                  <Text style={[styles.statText, { color: Colors.systemGreen as string }]}>{stats.priceCount} price</Text>
                </View>
              )}
              {stats.warningCount > 0 && (
                <View style={styles.statChip}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={12} color={Colors.systemRed as string} />
                  <Text style={[styles.statText, { color: Colors.systemRed as string }]}>{stats.warningCount} alert</Text>
                </View>
              )}
              {stats.altCount > 0 && (
                <View style={styles.statChip}>
                  <IconSymbol name="arrow.triangle.branch" size={12} color={Colors.systemBlue as string} />
                  <Text style={[styles.statText, { color: Colors.systemBlue as string }]}>{stats.altCount} alt</Text>
                </View>
              )}
              {stats.leverageCount > 0 && (
                <View style={styles.statChip}>
                  <IconSymbol name="flame.fill" size={12} color={Colors.systemOrange as string} />
                  <Text style={[styles.statText, { color: Colors.systemOrange as string }]}>{stats.leverageCount} leverage</Text>
                </View>
              )}
            </View>
          )}
          {stats.bestPrice && (
            <View style={styles.bestPriceCard}>
              <Text style={styles.bestPriceLabel}>Best price found</Text>
              <Text style={styles.bestPriceTitle} numberOfLines={1}>{stats.bestPrice.title}</Text>
              {stats.bestPrice.prices?.[0] && <Text style={styles.bestPriceValue}>{stats.bestPrice.prices[0]}</Text>}
            </View>
          )}
        </View>

        {/* Feedback */}
        {onFeedback && (
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackLabel}>How was this session?</Text>
            <View style={styles.feedbackButtons}>
              <Pressable style={styles.feedbackButton} onPress={() => { haptics.light(); onFeedback(true); }} accessibilityRole="button" accessibilityLabel="Good session">
                <IconSymbol name="hand.thumbsup.fill" size={IconSize["2xl"]} color={Colors.systemGreen as string} />
              </Pressable>
              <Pressable style={styles.feedbackButton} onPress={() => { haptics.light(); onFeedback(false); }} accessibilityRole="button" accessibilityLabel="Bad session">
                <IconSymbol name="hand.thumbsdown.fill" size={IconSize["2xl"]} color={Colors.systemRed as string} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Follow-up suggestions */}
        <View style={styles.followUpCard}>
          <View style={styles.followUpHeader}>
            <IconSymbol name="sparkles" size={IconSize.lg} color={Colors.systemOrange as string} />
            <Text style={styles.followUpTitle}>What's next?</Text>
          </View>
          <View style={styles.followUpChips}>
            {FOLLOWUP_SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.followUpChip} onPress={() => { haptics.light(); onFollowUp(s); }}>
                <Text style={styles.followUpChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Actions */}
        <Pressable style={styles.startButton} onPress={onNewSession} accessibilityRole="button">
          <IconSymbol name="mic.fill" size={IconSize["2xl"]} color={Colors.onColor} />
          <Text style={styles.startLabel}>New Session</Text>
        </Pressable>
        <Pressable onPress={onDismiss} hitSlop={12} style={styles.dismissButton} accessibilityRole="button">
          <Text style={styles.dismissLabel}>Dismiss</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Prices may vary. Always verify before purchasing.</Text>
      </ScrollView>
    </Animated.View>
  );
}

// --- Main Screen ---

export default function ConversationScreen() {
  const { startSession, endSession, toggleMicMuted, sendTextMessage, sendFeedback, canSendFeedback, status, isSpeaking, conversationPhase, isSearching, error, feedItems, sessionMode } =
    useCounter();
  const [micMuted, setMicMutedState] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SessionMode>("research");
  const [lastSessionFeed, setLastSessionFeed] = useState<typeof feedItems>([]);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const prevSearching = useRef(false);
  const textInputRef = useRef<TextInput>(null);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

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

  // Auto-enter immersive on first speaking
  useEffect(() => {
    if (isSpeaking && isConnected && feedItems.length <= 1) {
      setImmersiveMode(true);
    }
  }, [isSpeaking, isConnected]);

  // Exit immersive when results arrive
  useEffect(() => {
    const hasIntel = feedItems.some(f => f.type === "intel");
    if (hasIntel && immersiveMode) setImmersiveMode(false);
  }, [feedItems]);

  const handleStart = async (opts?: { context?: string; firstMessage?: string; mode?: SessionMode }) => {
    setIsStarting(true);
    setImmersiveMode(false);
    setShowTextInput(false);
    try {
      await startSession({ ...opts, mode: opts?.mode ?? selectedMode });
    } catch (e) {
      console.error("[Counter] Start failed:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    haptics.medium();
    setImmersiveMode(false);
    await endSession();
    setMicMutedState(false);
    setShowTextInput(false);
  };

  const handleMicToggle = () => {
    const next = !micMuted;
    setMicMutedState(next);
    toggleMicMuted(next);
    haptics.light();
  };

  const dismissSession = () => {
    setLastSessionFeed([]);
  };

  const handleTextSend = () => {
    if (!textInput.trim()) return;
    sendTextMessage(textInput.trim());
    haptics.light();
    setTextInput("");
    Keyboard.dismiss();
  };

  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (!showTextInput) setTimeout(() => textInputRef.current?.focus(), 100);
  };

  // --- Disconnected states ---
  if (!isConnected && !isConnecting) {
    // Post-session summary
    if (lastSessionFeed.length > 0) {
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.header}>
            <Text style={styles.wordmark}>Counter</Text>
            <Pressable onPress={() => { haptics.light(); router.push("/(app)/history"); }} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
              <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
            </Pressable>
          </View>
          <PostSessionSummary
            feed={lastSessionFeed}
            onNewSession={() => { dismissSession(); handleStart(); }}
            onDismiss={dismissSession}
            onFollowUp={(q) => { const ctx = buildSessionContext(lastSessionFeed, q); dismissSession(); handleStart({ context: ctx }); }}
            onFeedback={canSendFeedback ? sendFeedback : undefined}
          />
        </SafeAreaView>
      );
    }

    // Home screen
    return (
      <SafeAreaView style={styles.root}>
        {/* Ambient gradient backdrop */}
        <LinearGradient
          colors={["transparent", "rgba(0,136,255,0.05)", "rgba(0,136,255,0.08)", "rgba(0,136,255,0.03)", "transparent"]}
          locations={[0, 0.25, 0.45, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <Text style={styles.wordmark}>Counter</Text>
          <Pressable onPress={() => { haptics.light(); router.push("/(app)/history"); }} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
            <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
          {/* Orb */}
          <View style={styles.homeOrbWrap}>
            <Orb isSpeaking={false} isConnected isSearching={false} />
          </View>
          <Text style={styles.homeGreeting}>{getGreeting()}</Text>
          {error && <Text style={[styles.statusLabel, { color: Colors.systemRed as string }]}>{error}</Text>}

          {/* Mode selector */}
          <View style={styles.modeSelector}>
            {(["research", "practice", "live"] as SessionMode[]).map((mode) => {
              const cfg = MODE_CONFIGS[mode];
              const active = selectedMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[styles.modeCard, active && { borderColor: cfg.color, backgroundColor: `${cfg.color}12` }]}
                  onPress={() => { haptics.light(); setSelectedMode(mode); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <IconSymbol name={cfg.icon} size={IconSize["2xl"]} color={active ? cfg.color : (Colors.tertiaryLabel as string)} />
                  <Text style={[styles.modeLabel, active && { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.modeDescription} numberOfLines={2}>{cfg.description}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Start button */}
          <Pressable
            style={[styles.homeStartButton, { backgroundColor: MODE_CONFIGS[selectedMode].color, shadowColor: MODE_CONFIGS[selectedMode].color }, isStarting && styles.startButtonDisabled]}
            onPress={() => handleStart()}
            disabled={isStarting}
            accessibilityRole="button"
          >
            <IconSymbol name={selectedMode === "live" ? "ear.fill" : "mic.fill"} size={IconSize["3xl"]} color={Colors.onColor} />
            <Text style={styles.homeStartLabel}>{isStarting ? "Connecting..." : MODE_CONFIGS[selectedMode].startLabel}</Text>
          </Pressable>

          {/* Categories */}
          <Text style={styles.homeSectionLabel}>
            {selectedMode === "practice" ? "Practice scenario" : selectedMode === "live" ? "Go live with" : "Quick start"}
          </Text>
          <View style={styles.homeCategoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.label}
                style={({ pressed }) => [styles.homeCategoryCard, pressed && { opacity: 0.7 }]}
                onPress={() => { haptics.light(); handleStart({ context: cat.context, firstMessage: cat.greeting }); }}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
              >
                <IconSymbol name={cat.icon} size={IconSize["2xl"]} color={MODE_CONFIGS[selectedMode].color} />
                <Text style={styles.homeCategoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Suggestions */}
          <Text style={styles.homeSectionLabel}>Try saying</Text>
          <View style={styles.homeSuggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                style={({ pressed }) => [styles.homeSuggestionChip, pressed && { opacity: 0.7 }]}
                onPress={() => { haptics.light(); handleStart({ context: `The user wants to talk about: ${s}` }); }}
                accessibilityRole="button"
              >
                <IconSymbol name="mic.fill" size={IconSize.sm} color={Colors.tertiaryLabel as string} />
                <Text style={styles.homeSuggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
          <Orb isSpeaking={false} isConnected isSearching={false} />
          <Text style={styles.statusLabel}>Connecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Connected: feed layout ---
  return (
    <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      {/* Ambient gradient backdrop */}
      <LinearGradient
        colors={getPhaseGradient(conversationPhase)}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header with mini orb */}
      <View style={styles.headerConnected}>
        <Text style={styles.wordmark}>Counter</Text>
        <Pressable style={styles.headerCenter} onPress={() => setImmersiveMode(true)} accessibilityRole="button" accessibilityLabel="Enter immersive mode">
          <MiniOrb isSpeaking={isSpeaking} isConnected={isConnected} isSearching={isSearching} phase={conversationPhase} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={() => { haptics.light(); router.push("/(app)/history"); }} hitSlop={12} accessibilityRole="button" accessibilityLabel="View history">
            <IconSymbol name="clock" size={IconSize.xl} color={Colors.mutedForeground as string} />
          </Pressable>
        </View>
      </View>

      {/* Phase strip */}
      <View style={styles.phaseStrip}>
        <PhaseBadge phase={conversationPhase} mode={sessionMode} />
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
        {isSearching && <FeedItemView item={{ type: "searching", timestamp: Date.now() }} />}
      </ScrollView>

      {/* Text input bar */}
      {showTextInput && (
        <Animated.View style={styles.textInputBar} entering={SlideInDown.duration(200)} exiting={SlideOutDown.duration(150)}>
          <TextInput
            ref={textInputRef}
            style={styles.textInputField}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.tertiaryLabel as string}
            returnKeyType="send"
            onSubmitEditing={handleTextSend}
          />
          <Pressable style={styles.sendButton} onPress={handleTextSend} accessibilityRole="button" accessibilityLabel="Send message">
            <IconSymbol name="arrow.up.circle.fill" size={IconSize["3xl"]} color={textInput.trim() ? (Colors.primary as string) : (Colors.tertiaryLabel as string)} />
          </Pressable>
        </Animated.View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.sessionControls}>
          <Pressable
            style={[styles.iconButton, showTextInput && styles.iconButtonActive2]}
            onPress={toggleTextInput}
            accessibilityRole="button"
            accessibilityLabel={showTextInput ? "Hide keyboard" : "Show keyboard"}
          >
            <IconSymbol
              name="keyboard"
              size={IconSize.xl}
              color={showTextInput ? (Colors.primary as string) : (Colors.foreground as string)}
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

      {/* Immersive voice overlay */}
      {immersiveMode && (
        <ImmersiveVoiceOverlay
          isSpeaking={isSpeaking}
          isSearching={isSearching}
          phase={conversationPhase}
          mode={sessionMode}
          micMuted={micMuted}
          onMicToggle={handleMicToggle}
          onEnd={handleEnd}
          onDismiss={() => setImmersiveMode(false)}
        />
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  keyboardAvoiding: {
    flex: 1,
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
  // --- Home screen (disconnected) ---
  homeContent: {
    alignItems: "center",
    paddingBottom: Spacing["4xl"],
  },
  homeOrbWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  homeGreeting: {
    fontSize: FontSize["5xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    textAlign: "center",
    paddingHorizontal: Spacing["3xl"],
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  // --- Mode selector ---
  modeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  modeCard: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border as string,
    backgroundColor: Colors.card as string,
  },
  modeLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.foreground as string,
  },
  modeDescription: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    textAlign: "center",
    lineHeight: 14,
  },
  homeStartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primary as string,
    paddingHorizontal: Spacing["4xl"],
    paddingVertical: Spacing.xl,
    borderRadius: Radius.full,
    shadowColor: Colors.primary as string,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    marginTop: Spacing["2xl"],
    marginBottom: Spacing["3xl"],
  },
  homeStartLabel: {
    fontSize: FontSize["3xl"],
    fontWeight: "700",
    color: Colors.onColor,
    letterSpacing: 0.2,
  },
  homeSectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.tertiaryLabel as string,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  homeCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  homeCategoryCard: {
    width: (Dimensions.get("window").width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.card as string,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border as string,
  },
  homeCategoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.foreground as string,
  },
  homeSuggestions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    width: "100%",
  },
  homeSuggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card as string,
    borderWidth: 1,
    borderColor: Colors.border as string,
  },
  homeSuggestionText: {
    fontSize: FontSize.base,
    color: Colors.foreground as string,
    fontWeight: "500",
  },
  // --- Orb ---
  orbArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  orbContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbRing: {
    position: "absolute",
    borderWidth: 1.5,
  },
  orb: {
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
    fontSize: FontSize.lg,
    color: Colors.mutedForeground as string,
    textAlign: "center",
    paddingHorizontal: Spacing["3xl"],
    lineHeight: 24,
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
  // --- Text Input ---
  textInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border as string,
    backgroundColor: Colors.card as string,
  },
  textInputField: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.foreground as string,
    backgroundColor: Colors.secondarySystemFill as string,
    borderRadius: Radius["2xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    minHeight: 40,
  },
  sendButton: {
    padding: Spacing.xs,
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
  iconButtonActive2: {
    backgroundColor: Colors.primaryFill as unknown as string,
    borderColor: Colors.borderAccent as unknown as string,
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
  // --- Post-session summary ---
  postSessionContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.xl,
  },
  summaryCard: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card as string,
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    borderColor: Colors.border as string,
  },
  summaryTitle: {
    fontSize: FontSize["4xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondarySystemFill as string,
  },
  statText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  bestPriceCard: {
    width: "100%",
    padding: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.successFill as unknown as string,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.successBorder as unknown as string,
    gap: Spacing.xxs,
  },
  bestPriceLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.systemGreen as string,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bestPriceTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.foreground as string,
  },
  bestPriceValue: {
    fontSize: FontSize["5xl"],
    fontWeight: "800",
    color: Colors.systemGreen as string,
    fontVariant: ["tabular-nums"],
  },
  // Feedback
  feedbackRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  feedbackLabel: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
    fontWeight: "500",
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  feedbackButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondarySystemFill as string,
    alignItems: "center",
    justifyContent: "center",
  },
  // Follow-up card
  followUpCard: {
    width: "100%",
    padding: Spacing.lg,
    backgroundColor: Colors.warningBackground as unknown as string,
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    borderColor: Colors.goldBorder as unknown as string,
    gap: Spacing.md,
  },
  followUpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  followUpTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.systemOrange as string,
  },
  followUpChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  followUpChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card as string,
    borderWidth: 1,
    borderColor: Colors.border as string,
  },
  followUpChipText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.foreground as string,
  },
  dismissButton: {
    paddingVertical: Spacing.md,
  },
  dismissLabel: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.quaternaryLabel as string,
    textAlign: "center",
    paddingTop: Spacing.sm,
  },
  // --- Immersive voice overlay ---
  immersiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 60,
  },
  immersiveDismiss: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Overlay.onDarkFill,
  },
  immersiveCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["2xl"],
  },
  immersivePhase: {
    fontSize: FontSize["3xl"],
    fontWeight: "600",
    color: Overlay.onDarkSecondary,
    letterSpacing: 0.5,
  },
  immersiveLiveHint: {
    fontSize: FontSize.sm,
    color: Overlay.onDarkTertiary,
    fontWeight: "500",
  },
  immersiveControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["4xl"],
  },
  immersiveButton: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  immersiveButtonActive: {
    opacity: 0.6,
  },
  immersiveEndButton: {
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Overlay.destructiveFill,
    borderRadius: Radius.full,
    width: 72,
    height: 72,
    justifyContent: "center",
  },
  immersiveButtonLabel: {
    fontSize: FontSize.sm,
    color: Overlay.onDarkTertiary,
    fontWeight: "500",
  },
});
