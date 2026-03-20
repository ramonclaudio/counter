import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { MaterialCard } from "@/components/ui/material-card";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, LineHeight } from "@/constants/layout";
import type { IntelCard as IntelCardType } from "@/lib/types";

// Neutral gray-blue placeholder
const PLACEHOLDER_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const TYPE_CONFIG = {
  price: { color: Colors.systemGreen, label: "Price" },
  warning: { color: Colors.systemRed, label: "Warning" },
  alternative: { color: Colors.systemBlue, label: "Alt" },
  leverage: { color: Colors.systemYellow, label: "Leverage" },
} as const;

type Props = { card: IntelCardType };

export function IntelCard({ card }: Props) {
  const config = TYPE_CONFIG[card.type];
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 250 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleSourcePress = () => {
    if (card.sourceUrl) Linking.openURL(card.sourceUrl);
  };

  const hasPrices = card.prices && card.prices.length > 0;
  const hasImage = !!card.imageUrl && !imageError;
  const hasFavicon = !!card.faviconUrl;

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCard style={styles.card}>
        <View style={[styles.accent, { backgroundColor: config.color as string }]} />
        <View style={styles.body}>
          {/* Header: badge + title */}
          <View style={styles.header}>
            <View style={[styles.typeBadge, { backgroundColor: `${config.color}18`, borderColor: config.color as string }]}>
              <Text style={[styles.typeLabel, { color: config.color as string }]}>{config.label}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{card.title}</Text>
          </View>

          {/* Content row: image + text */}
          <View style={styles.contentRow}>
            {hasImage && (
              <Image
                source={{ uri: card.imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
                recyclingKey={card.id}
                placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
                onError={() => setImageError(true)}
              />
            )}
            <View style={[styles.textContent, !hasImage && styles.textContentFull]}>
              {hasPrices && (
                <View style={styles.priceRow}>
                  {card.prices!.slice(0, 4).map((price, i) => (
                    <View key={`${price}-${i}`} style={styles.priceChip}>
                      <Text style={styles.priceText}>{price}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.value} numberOfLines={hasPrices ? 2 : 3}>
                {card.value}
              </Text>
            </View>
          </View>

          {/* Source row: favicon + hostname */}
          <Pressable onPress={handleSourcePress} hitSlop={8} style={styles.sourceRow}>
            {hasFavicon && (
              <Image
                source={{ uri: card.faviconUrl }}
                style={styles.favicon}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            )}
            <Text style={styles.source} numberOfLines={1}>
              {card.siteName ?? card.source}
            </Text>
          </Pressable>
        </View>
      </MaterialCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  accent: {
    width: 4,
    borderTopLeftRadius: Radius.sm,
    borderBottomLeftRadius: Radius.sm,
  },
  body: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.foreground as string,
    lineHeight: LineHeight.base,
  },
  contentRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary as string,
  },
  textContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  textContentFull: {},
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  priceChip: {
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  priceText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.systemGreen as string,
    fontVariant: ["tabular-nums"],
  },
  value: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground as string,
    lineHeight: LineHeight.base,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  source: {
    fontSize: FontSize.xs,
    color: Colors.link as string,
  },
});
