import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";

import { IntelCard } from "@/components/counter/intel-card";
import { SearchIndicator } from "@/components/counter/search-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, CardTypeColors } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize, FontFamily } from "@/constants/layout";
import { haptics } from "@/lib/haptics";
import type { FeedItem, IntelCardType } from "@/lib/types";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function UserBubble({ item }: { item: Extract<FeedItem, { type: "user-message" }> }) {
  return (
    <View style={s.userRow}>
      <View style={s.userBubble}>
        <Text style={s.userText}>{item.message.content}</Text>
      </View>
      <Text style={s.userTime}>{formatTime(item.message.timestamp)}</Text>
    </View>
  );
}

function AssistantBlock({ item }: { item: Extract<FeedItem, { type: "assistant-message" }> }) {
  return (
    <View style={s.assistantRow}>
      <View style={s.assistantIcon}>
        <IconSymbol name="sparkles" size={12} color={Colors.primary as string} />
      </View>
      <View style={s.assistantBody}>
        <Text style={s.assistantText}>{item.message.content}</Text>
        <Text style={s.assistantTime}>{formatTime(item.message.timestamp)}</Text>
      </View>
    </View>
  );
}

type FilterKey = "all" | IntelCardType;

const FILTER_OPTIONS: { key: FilterKey; label: string; color: string }[] = [
  { key: "all", label: "All", color: Colors.systemBlue as string },
  { key: "price", label: "Price", color: CardTypeColors.price.color as string },
  { key: "warning", label: "Warning", color: CardTypeColors.warning.color as string },
  { key: "alternative", label: "Alternative", color: CardTypeColors.alternative.color as string },
  { key: "leverage", label: "Leverage", color: CardTypeColors.leverage.color as string },
];

function FilterChip(
  { label, count, color, active, onPress }:
  { label: string; count: number; color: string; active: boolean; onPress: () => void },
) {
  return (
    <Pressable
      onPress={() => { haptics.light(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label.toLowerCase()}`}
      accessibilityState={{ selected: active }}
      style={[
        s.filterChip,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: "transparent", borderColor: color },
      ]}
    >
      <Text style={[s.filterChipText, { color: active ? (Colors.onColor as string) : color }]}>
        {label}{count > 0 ? ` (${count})` : ""}
      </Text>
    </Pressable>
  );
}

function IntelSection({ item }: { item: Extract<FeedItem, { type: "intel" }> }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const map: Record<IntelCardType, number> = { price: 0, warning: 0, alternative: 0, leverage: 0 };
    for (const card of item.cards) map[card.type]++;
    return map;
  }, [item.cards]);

  const filteredCards = useMemo(
    () => activeFilter === "all" ? item.cards : item.cards.filter((c) => c.type === activeFilter),
    [item.cards, activeFilter],
  );

  // Collect unique sources with favicons
  const sources = item.cards.reduce<{ name: string; favicon?: string }[]>((acc, card) => {
    const name = card.siteName ?? card.source;
    if (name && !acc.find((src) => src.name === name)) {
      acc.push({ name, favicon: card.faviconUrl });
    }
    return acc;
  }, []);

  return (
    <View style={s.intelSection}>
      <View style={s.intelHeader}>
        <IconSymbol name="magnifyingglass" size={12} color={Colors.secondaryLabel as string} />
        <Text style={s.intelLabel}>
          {item.cards.length} {item.cards.length === 1 ? "result" : "results"} from {sources.length} {sources.length === 1 ? "source" : "sources"}
        </Text>
      </View>
      {sources.length > 0 && (
        <View style={s.sourceRow}>
          {sources.slice(0, 5).map((src) => (
            <View key={src.name} style={s.sourceChip}>
              {src.favicon && (
                <Image source={{ uri: src.favicon }} style={s.sourceFavicon} contentFit="contain" cachePolicy="memory-disk" accessible={false} />
              )}
              <Text style={s.sourceName} numberOfLines={1}>{src.name}</Text>
            </View>
          ))}
        </View>
      )}
      {item.cards.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              count={opt.key === "all" ? item.cards.length : counts[opt.key]}
              color={opt.color}
              active={activeFilter === opt.key}
              onPress={() => setActiveFilter(opt.key)}
            />
          ))}
        </ScrollView>
      )}
      {filteredCards.map((card) => (
        <IntelCard key={card.id} card={card} />
      ))}
      <View style={s.followUpRow}>
        <IconSymbol name="bubble.left" size={12} color={Colors.tertiaryLabel as string} />
        <Text style={s.followUpText}>Ask a follow-up</Text>
      </View>
    </View>
  );
}

function FeedItemInner({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "user-message":
      return <UserBubble item={item} />;
    case "assistant-message":
      return <AssistantBlock item={item} />;
    case "intel":
      return <IntelSection item={item} />;
    case "searching":
      return <SearchIndicator visible />;
  }
}

export const FeedItemView = React.memo(FeedItemInner);

const s = StyleSheet.create({
  // User
  userRow: {
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
  },
  userBubble: {
    maxWidth: "75%",
    backgroundColor: Colors.systemBlue as string,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  userText: {
    color: Colors.onColor,
    fontSize: FontSize.base,
    lineHeight: LineHeight.relaxed,
    fontFamily: FontFamily.regular,
  },
  userTime: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    marginTop: Spacing.xxs,
    fontFamily: FontFamily.regular,
  },
  // Assistant
  assistantRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  assistantIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryFill as unknown as string,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  assistantBody: {
    flex: 1,
  },
  assistantText: {
    color: Colors.foreground as string,
    fontSize: FontSize.base,
    lineHeight: LineHeight.loose,
    fontFamily: FontFamily.regular,
  },
  assistantTime: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    marginTop: Spacing.xxs,
    fontFamily: FontFamily.regular,
  },
  // Intel
  intelSection: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  intelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: Spacing.xs,
  },
  intelLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.secondaryLabel as string,
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.tertiarySystemFill as string,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator as string,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  sourceFavicon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  sourceName: {
    fontSize: FontSize.xs,
    color: Colors.secondaryLabel as string,
    fontFamily: FontFamily.medium,
    maxWidth: 80,
  },
  followUpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  followUpText: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    fontFamily: FontFamily.medium,
  },
});
