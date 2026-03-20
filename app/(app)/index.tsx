import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  SafeAreaView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import { Audio } from "expo-av";

import { useCounter } from "@/hooks/use-counter";
import { IntelCard } from "@/components/counter/intel-card";
import { PhaseBadge } from "@/components/counter/phase-badge";
import { SearchIndicator } from "@/components/counter/search-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, TouchTarget, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";

const ORB_SIZE = 180;
const ORB_RING_SIZE = ORB_SIZE + 40;

function Orb({ isSpeaking, isConnected }: { isSpeaking: boolean; isConnected: boolean }) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.6);

  useEffect(() => {
    if (isSpeaking) {
      pulse.value = withRepeat(
        withSequence(
          withSpring(1.06, { damping: 8, stiffness: 120 }),
          withSpring(0.97, { damping: 8, stiffness: 120 }),
        ),
        -1,
        true,
      );
      ring.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.6, { duration: 700 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withSpring(1, { damping: 12 });
      ring.value = withTiming(isConnected ? 0.8 : 0.3, { duration: 400 });
    }
  }, [isSpeaking, isConnected]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [
      {
        scale: interpolate(ring.value, [0.3, 1], [0.95, 1.05]),
      },
    ],
  }));

  const orbColor = isConnected ? Colors.primary : Colors.systemGray3;

  return (
    <View style={styles.orbContainer}>
      <Animated.View
        style={[
          styles.orbRing,
          ringStyle,
          { borderColor: orbColor as string },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          orbStyle,
          {
            backgroundColor: orbColor as string,
            shadowColor: orbColor as string,
          },
        ]}
      />
    </View>
  );
}

export default function ConversationScreen() {
  const { startSession, endSession, setMicMuted, status, isSpeaking, intelCards, conversationPhase, isSearching } =
    useCounter();
  const [micMuted, setMicMutedState] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  useEffect(() => {
    if (intelCards.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [intelCards.length]);

  const requestMicPermission = async (): Promise<boolean> => {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  };

  const handleStart = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      Alert.alert(
        "Microphone Required",
        "Counter needs microphone access for voice conversations.",
        [{ text: "OK" }],
      );
      return;
    }
    setIsStarting(true);
    try {
      await startSession();
    } catch (e) {
      Alert.alert("Connection Failed", "Could not connect to Counter. Try again.");
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
    setMicMuted(next);
    haptics.light();
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Counter</Text>
        {isConnected && <PhaseBadge phase={conversationPhase} />}
      </View>

      {/* Orb area */}
      <View style={styles.orbArea}>
        <Orb isSpeaking={isSpeaking} isConnected={isConnected} />
        {!isConnected && !isConnecting && (
          <Text style={styles.tagline}>AI deal intelligence, in your corner.</Text>
        )}
        {isConnecting && (
          <Text style={styles.connectingLabel}>Connecting...</Text>
        )}
        <SearchIndicator visible={isSearching} />
      </View>

      {/* Intel cards */}
      {isConnected && (
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
  orbArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  orbContainer: {
    width: ORB_RING_SIZE,
    height: ORB_RING_SIZE,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 12,
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
  cardsScroll: {
    flex: 1,
    maxHeight: 340,
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
