import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
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

const SIZE = 50;
const RING = SIZE + 12;
const DOT_COUNT = 3;
const DOT_RADIUS = RING / 2 + 8;
import { AnimationColors, Colors } from "@/constants/theme";
const SPEAK_COLORS = AnimationColors.speaking;
const SEARCH_COLOR = AnimationColors.search;

function MiniOrbDot({ index, total, rotate }: { index: number; total: number; rotate: import("react-native-reanimated").SharedValue<number> }) {
  const angle = (2 * Math.PI * index) / total;
  const style = useAnimatedStyle(() => {
    const a = angle + rotate.value;
    const fade = 0.4 + 0.6 * ((index / total + rotate.value / (2 * Math.PI)) % 1);
    return { transform: [{ translateX: Math.cos(a) * DOT_RADIUS }, { translateY: Math.sin(a) * DOT_RADIUS }], opacity: fade };
  });
  return <Animated.View style={[s.dot, style]} />;
}

export function MiniOrb({ isSpeaking, isConnected, isSearching }: { isSpeaking: boolean; isConnected: boolean; isSearching: boolean }) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.6);
  const mode = useSharedValue(0); // 0=listen, 1=speak, 2=search, 3=disconnected
  const colorProg = useSharedValue(0);
  const dotRotate = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      mode.value = 3;
      pulse.value = withSpring(1, { damping: 12 });
      ring.value = withTiming(0.3, { duration: 400 });
      colorProg.value = 0;
    } else if (isSearching) {
      mode.value = 2;
      pulse.value = withRepeat(withSequence(withTiming(1.03, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) }), withTiming(0.98, { duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1) })), -1, true);
      ring.value = withTiming(0.5, { duration: 300 });
      colorProg.value = 0;
    } else if (isSpeaking) {
      mode.value = 1;
      pulse.value = withRepeat(withSequence(withSpring(1.04, { damping: 6, stiffness: 140 }), withSpring(0.97, { damping: 6, stiffness: 140 })), -1, true);
      ring.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.55, { duration: 500 })), -1, true);
      colorProg.value = withRepeat(withTiming(SPEAK_COLORS.length - 1, { duration: 2400, easing: Easing.linear }), -1, false);
    } else {
      mode.value = 0;
      pulse.value = withRepeat(withSequence(withTiming(1.01, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), withTiming(0.99, { duration: 1000, easing: Easing.bezier(0.42, 0, 0.58, 1) })), -1, true);
      ring.value = withTiming(0.75, { duration: 400 });
      colorProg.value = 0;
    }
  }, [isSpeaking, isConnected, isSearching]);

  useEffect(() => {
    dotRotate.value = isSearching
      ? withRepeat(withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }), -1, false)
      : withTiming(0, { duration: 300 });
  }, [isSearching]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value, transform: [{ scale: interpolate(ring.value, [0.3, 1], [0.95, 1.08]) }] }));
  const orbColor = useAnimatedStyle(() => {
    if (mode.value === 3) return { backgroundColor: Colors.systemGray as string, shadowOpacity: 0.1 };
    if (mode.value === 2) return { backgroundColor: SEARCH_COLOR, shadowOpacity: 0.35 };
    if (mode.value === 1) return { backgroundColor: interpolateColor(colorProg.value, [0, 1, 2, 3, 4], SPEAK_COLORS), shadowOpacity: 0.45 };
    return { backgroundColor: Colors.primary as string, shadowOpacity: 0.3 };
  });

  const ringColor = isSearching ? SEARCH_COLOR : isConnected ? Colors.primary as string : Colors.systemGray as string;
  const shadowColor = isSearching ? SEARCH_COLOR : Colors.primary as string;

  return (
    <View style={s.container}>
      {isSearching && Array.from({ length: DOT_COUNT }).map((_, i) => <MiniOrbDot key={i} index={i} total={DOT_COUNT} rotate={dotRotate} />)}
      <Animated.View style={[s.ring, ringStyle, { borderColor: ringColor }]} />
      <Animated.View style={[s.orb, orbStyle, orbColor, { shadowColor }]} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: RING + 20, height: RING + 20, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: RING, height: RING, borderRadius: RING / 2, borderWidth: 1 },
  orb: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 6 },
  dot: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: SEARCH_COLOR },
});
