import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { MiniOrb } from "@/components/counter/mini-orb";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";

const ONBOARDING_KEY = "counter_onboarding_seen";

export default function WelcomeScreen() {
  const orbOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(12);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslate = useSharedValue(12);

  useEffect(() => {
    orbOpacity.value = withTiming(1, { duration: 600 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    titleTranslate.value = withDelay(
      300,
      withSpring(0, { damping: 20, stiffness: 180 }),
    );
    ctaOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    ctaTranslate.value = withDelay(
      600,
      withSpring(0, { damping: 20, stiffness: 180 }),
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({ opacity: orbOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslate.value }],
  }));

  const handleContinue = async () => {
    haptics.medium();
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(app)");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Animated.View style={[styles.orbWrap, orbStyle]}>
          <MiniOrb isSpeaking={false} isConnected={true} isSearching={false} />
        </Animated.View>

        <Animated.View style={[styles.textWrap, titleStyle]}>
          <Text style={styles.title} accessibilityRole="header">Meet Counter</Text>
          <Text style={styles.subtitle}>
            I research deals while you talk. Prices, alternatives, warnings, and
            negotiation leverage, all in real time.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.features, titleStyle]} accessibilityRole="summary" accessibilityLabel="Key features">
          <View style={styles.featureRow}>
            <IconSymbol
              name="mic.fill"
              size={IconSize.md}
              color={Colors.primary as string}
            />
            <Text style={styles.featureText}>
              Speak naturally about what you're buying
            </Text>
          </View>
          <View style={styles.featureRow}>
            <IconSymbol
              name="magnifyingglass"
              size={IconSize.md}
              color={Colors.systemOrange as string}
            />
            <Text style={styles.featureText}>
              Real-time web research as you talk
            </Text>
          </View>
          <View style={styles.featureRow}>
            <IconSymbol
              name="tag.fill"
              size={IconSize.md}
              color={Colors.systemGreen as string}
            />
            <Text style={styles.featureText}>
              Prices, alternatives, and deal intel
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <Pressable
          style={styles.ctaButton}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background as string,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing["2xl"],
  },
  orbWrap: {
    marginBottom: Spacing.md,
  },
  textWrap: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize["7xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  features: {
    gap: Spacing.lg,
    paddingTop: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureText: {
    fontSize: FontSize.base,
    color: Colors.foreground as string,
  },
  ctaWrap: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["2xl"],
  },
  ctaButton: {
    backgroundColor: Colors.primary as string,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: "center",
    shadowColor: Colors.primary as string,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    color: Colors.onColor,
    letterSpacing: 0.3,
  },
});
