import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { haptics } from "@/lib/haptics";
import { Colors, Radius, Scrim, OnImage, CardTypeColors } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize } from "@/constants/layout";
import { relativeTime } from "@/lib/time";
import type { IntelCard as IntelCardType } from "@/lib/types";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const PLACEHOLDER_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const TYPE_CONFIG = CardTypeColors;

function parseSavings(prices: string[]): { savings: number; label: string } | null {
  if (!prices || prices.length < 2) return null;
  const nums = prices
    .map((p) => parseFloat(p.replace(/[^0-9.]/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
  if (nums.length < 2) return null;
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  if (max === min) return null;
  const pct = Math.round(((max - min) / max) * 100);
  if (pct < 5 || pct > 90) return null;
  return { savings: pct, label: `Save ${pct}%` };
}

type Props = { card: IntelCardType };

export function IntelCard({ card }: Props) {
  const config = TYPE_CONFIG[card.type];
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleSourcePress = () => {
    if (card.sourceUrl) Linking.openURL(card.sourceUrl);
  };

  const handleToggle = () => {
    haptics.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const hasPrices = card.prices && card.prices.length > 0;
  const hasImage = !!card.imageUrl && !imageError;
  const hasFavicon = !!card.faviconUrl;
  const hasHighlights = card.highlights && card.highlights.length > 0;
  const hasFullValue = !!card.fullValue;
  const hasDate = !!card.date;
  const isExpandable = hasFullValue || hasHighlights;
  const displayPrices = expanded ? card.prices?.slice(0, 6) : card.prices?.slice(0, 4);
  const savings = parseSavings(card.prices ?? []);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={isExpandable ? handleToggle : undefined}
        accessibilityRole={isExpandable ? "button" : undefined}
        accessibilityLabel={`${config.label}: ${card.title}`}
        accessibilityState={isExpandable ? { expanded } : undefined}
        accessibilityHint={isExpandable ? "Double tap to expand details" : undefined}
      >
        <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
          {/* Hero image with gradient scrim */}
          {hasImage && (
            <View style={expanded ? styles.heroWrap : styles.previewWrap}>
              <Image
                source={{ uri: card.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                recyclingKey={card.id}
                placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
                onError={() => setImageError(true)}
              />
              <View style={styles.imageScrim} />
              {/* Source on image */}
              <View style={styles.imageSource}>
                {hasFavicon && (
                  <Image source={{ uri: card.faviconUrl }} style={styles.faviconSmall} contentFit="contain" cachePolicy="memory-disk" />
                )}
                <Text style={styles.imageSourceText} numberOfLines={1}>{card.siteName ?? card.source}</Text>
                {hasDate && <Text style={styles.imageDateText}>{relativeTime(card.date!)}</Text>}
              </View>
            </View>
          )}

          <View style={styles.body}>
            {/* Type badge + source (when no image) */}
            {!hasImage && (
              <View style={styles.topRow}>
                <View style={[styles.typeBadge, { borderColor: config.color }]}>
                  <IconSymbol name={config.icon} size={10} color={config.color} />
                  <Text style={[styles.typeBadgeLabel, { color: config.color }]}>{config.label}</Text>
                </View>
                <Pressable onPress={handleSourcePress} hitSlop={8} style={styles.sourceChip}
                  accessibilityRole="link"
                  accessibilityLabel={`Source: ${card.siteName ?? card.source}`}
                >
                  {hasFavicon && (
                    <Image source={{ uri: card.faviconUrl }} style={styles.favicon} contentFit="contain" cachePolicy="memory-disk" />
                  )}
                  <Text style={styles.sourceName} numberOfLines={1}>{card.siteName ?? card.source}</Text>
                  {hasDate && <Text style={styles.dateText}>{relativeTime(card.date!)}</Text>}
                </Pressable>
              </View>
            )}

            {/* Type badge on image cards */}
            {hasImage && (
              <View style={[styles.typeBadge, { borderColor: config.color, alignSelf: "flex-start" }]}>
                <IconSymbol name={config.icon} size={10} color={config.color} />
                <Text style={[styles.typeBadgeLabel, { color: config.color }]}>{config.label}</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={expanded ? 6 : 2}>{card.title}</Text>

            {/* Prices - prominent */}
            {hasPrices && (
              <View style={styles.priceRow}>
                {displayPrices!.map((price, i) => (
                  <View key={`${price}-${i}`} style={styles.priceChip}>
                    <Text style={styles.priceText}>{price}</Text>
                  </View>
                ))}
              </View>
            )}

            {savings && (
              <View style={styles.savingsBadge}>
                <IconSymbol name="arrow.down.circle.fill" size={12} color={Colors.systemGreen as string} />
                <Text style={styles.savingsText}>{savings.label}</Text>
              </View>
            )}

            {/* Value */}
            <Text style={styles.value} numberOfLines={expanded ? undefined : 3}>
              {expanded && hasFullValue ? card.fullValue : card.value}
            </Text>

            {/* Highlights */}
            {expanded && hasHighlights && (
              <View style={styles.highlights}>
                {card.highlights!.map((h, i) => (
                  <View key={i} style={styles.highlightRow}>
                    <View style={[styles.highlightDot, { backgroundColor: config.color }]} />
                    <Text style={styles.highlightText} numberOfLines={3}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Source URL expanded */}
            {expanded && card.sourceUrl && (
              <Pressable onPress={handleSourcePress} hitSlop={8}>
                <Text style={styles.sourceUrl} numberOfLines={1}>{card.sourceUrl}</Text>
              </Pressable>
            )}

            {/* Expand toggle */}
            {isExpandable && (
              <Pressable onPress={handleToggle} style={styles.expandRow}
                accessibilityRole="button"
                accessibilityLabel={expanded ? "Show less details" : "Show more details"}
              >
                <Text style={styles.expandLabel}>{expanded ? "Show less" : "Show more"}</Text>
                <IconSymbol name={expanded ? "chevron.up" : "chevron.down"} size={10} color={Colors.tertiaryLabel as string} />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    borderCurve: "continuous",
  },
  // Hero image
  previewWrap: {
    height: 140,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: "hidden",
  },
  heroWrap: {
    height: 200,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: "hidden",
  },
  imageScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: Scrim.heavy,
  },
  imageSource: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  faviconSmall: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  imageSourceText: {
    fontSize: FontSize.xs,
    color: OnImage.primary,
    fontWeight: "600",
    flex: 1,
  },
  imageDateText: {
    fontSize: FontSize.xs,
    color: OnImage.quaternary,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  // Top row (no image)
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  typeBadgeLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "flex-end",
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  sourceName: {
    fontSize: FontSize.xs,
    color: Colors.secondaryLabel as string,
    fontWeight: "500",
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
  },
  // Title
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    lineHeight: LineHeight["2xl"],
    letterSpacing: -0.3,
  },
  // Prices
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  priceChip: {
    backgroundColor: Colors.successFill as unknown as string,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.successBorder as unknown as string,
  },
  priceText: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.systemGreen as string,
    fontVariant: ["tabular-nums"],
  },
  // Savings badge
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  savingsText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.systemGreen as string,
  },
  // Value
  value: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
    lineHeight: LineHeight.loose,
  },
  // Highlights
  highlights: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.foreground as string,
    lineHeight: LineHeight.loose,
  },
  // Source URL
  sourceUrl: {
    fontSize: FontSize.xs,
    color: Colors.link as string,
  },
  // Expand
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: Spacing.xs,
    minHeight: 44,
  },
  expandLabel: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    fontWeight: "600",
  },
});
