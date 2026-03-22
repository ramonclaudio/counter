import { Easing } from "react-native-reanimated";

export const Spring = {
  gentle: { damping: 20, stiffness: 180 },
  snappy: { damping: 15, stiffness: 200 },
  bouncy: { damping: 8, stiffness: 150 },
} as const;

export const Timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  xslow: 600,
} as const;

export const Ease = {
  standard: Easing.bezier(0.42, 0, 0.58, 1),
  out: Easing.bezier(0, 0, 0.58, 1),
  in: Easing.bezier(0.42, 0, 1, 1),
  linear: Easing.linear,
} as const;
