import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { IntelCard } from "@/components/counter/intel-card";
import { SearchIndicator } from "@/components/counter/search-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize } from "@/constants/layout";
import type { FeedItem } from "@/lib/types";

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

function IntelSection({ item }: { item: Extract<FeedItem, { type: "intel" }> }) {
  // Collect unique sources with favicons
  const sources = item.cards.reduce<{ name: string; favicon?: string }[]>((acc, card) => {
    const name = card.siteName ?? card.source;
    if (name && !acc.find((s) => s.name === name)) {
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
                <Image source={{ uri: src.favicon }} style={s.sourceFavicon} contentFit="contain" cachePolicy="memory-disk" />
              )}
              <Text style={s.sourceName} numberOfLines={1}>{src.name}</Text>
            </View>
          ))}
        </View>
      )}
      {item.cards.map((card) => (
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
  },
  userTime: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    marginTop: Spacing.xxs,
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
  },
  assistantTime: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryLabel as string,
    marginTop: Spacing.xxs,
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
    fontWeight: "600",
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondarySystemFill as string,
  },
  sourceFavicon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  sourceName: {
    fontSize: FontSize.xs,
    color: Colors.secondaryLabel as string,
    fontWeight: "500",
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
    fontWeight: "500",
  },
});
