import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useQuery } from "convex/react";
import { Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import * as Clipboard from "expo-clipboard";
import { api } from "@/convex/_generated/api";
import { haptics } from "@/lib/haptics";
import type { Id } from "@/convex/_generated/dataModel";
import { useColors } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { IntelCard } from "@/components/counter/intel-card";
import { Colors, OnImage, Radius, AnimationColors } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize, FontFamily } from "@/constants/layout";
import type { IntelCard as IntelCardType, Message } from "@/lib/types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textAssistant]}>
          {msg.content}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const messageKeyExtractor = (_item: Message, index: number) => String(index);

const buildTranscript = (messages: Message[]): string =>
  messages.map((m) => `${m.role === "user" ? "You" : "Agent"}: ${m.content}`).join("\n\n");

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"transcript" | "intel">("transcript");
  const conv = useQuery(api.conversations.getConversation, {
    conversationId: id as Id<"conversations">,
  });

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble msg={item} />,
    [],
  );

  const messages = conv ? (conv.messages as Message[]) : [];

  const handleShare = useCallback(() => {
    if (!conv) return;
    haptics.light();
    Share.share({
      message: conv.summary || buildTranscript(messages),
    });
  }, [conv, messages]);

  const handleCopy = useCallback(() => {
    if (!conv) return;
    haptics.light();
    Clipboard.setStringAsync(buildTranscript(messages));
  }, [conv, messages]);

  return (
    <>
    {conv && (
      <Stack.Toolbar>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={handleShare}>
          Share
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="doc.on.doc" onPress={handleCopy}>
          Copy
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
    )}
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background as string }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back to history">
          <IconSymbol name="chevron.left" size={IconSize.xl} color={Colors.systemBlue as string} />
          <Text style={styles.backLabel}>History</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {conv?.title ?? "Conversation"}
          </Text>
          {conv && (
            <Text style={styles.subtitle}>{formatDate(conv.createdAt)}</Text>
          )}
        </View>
        <View style={styles.backButton} />
      </View>

      {conv === undefined ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Loading...</Text>
        </View>
      ) : conv === null ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Conversation not found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.tabBar} accessibilityRole="tablist">
            <Pressable
              style={[styles.tab, activeTab === "transcript" && styles.tabActive]}
              onPress={() => { haptics.light(); setActiveTab("transcript"); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "transcript" }}
              accessibilityLabel="Transcript tab"
            >
              <Text style={[styles.tabText, activeTab === "transcript" && styles.tabTextActive]}>
                Transcript
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "intel" && styles.tabActive]}
              onPress={() => { haptics.light(); setActiveTab("intel"); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "intel" }}
              accessibilityLabel={`Intel tab, ${(conv.intelCards as IntelCardType[]).length} findings`}
            >
              <Text style={[styles.tabText, activeTab === "intel" && styles.tabTextActive]}>
                Intel ({(conv.intelCards as IntelCardType[]).length})
              </Text>
            </Pressable>
          </View>

          {conv.summary && (
            <View style={styles.summaryBanner} accessibilityRole="summary" accessibilityLabel={`Session summary: ${conv.summary}`}>
              <IconSymbol name="sparkles" size={IconSize.lg} color={AnimationColors.search} />
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <Text style={styles.summaryText}>{conv.summary}</Text>
                {conv.durationSeconds != null && (
                  <Text style={styles.summaryMeta}>
                    {Math.floor(conv.durationSeconds / 60)}m {conv.durationSeconds % 60}s
                    {conv.sessionMode ? ` · ${conv.sessionMode}` : ""}
                    {conv.callSuccessful != null ? (conv.callSuccessful ? " · Goal met" : " · Goal not met") : ""}
                  </Text>
                )}
              </View>
            </View>
          )}

          {conv.collectedData && Object.keys(conv.collectedData as Record<string, unknown>).length > 0 && (
            <View style={styles.collectedDataRow}>
              {Object.entries(conv.collectedData as Record<string, { value: unknown }>).map(([key, item]) => (
                <View key={key} style={styles.collectedDataChip}>
                  <Text style={styles.collectedDataLabel}>{key.replace(/_/g, " ")}</Text>
                  <Text style={styles.collectedDataValue}>{String(item.value)}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "transcript" ? (
            messages.length > 0 ? (
              <FlashList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={messageKeyExtractor}
                estimatedItemSize={80}
                contentContainerStyle={styles.transcriptList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.center}>
                <Text style={styles.muted}>No messages yet</Text>
              </View>
            )
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {(conv.intelCards as IntelCardType[]).length > 0 ? (
                <View style={styles.intelSection}>
                  <View style={styles.intelAccent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.intelSectionTitle}>
                      {(conv.intelCards as IntelCardType[]).length}{" "}
                      {(conv.intelCards as IntelCardType[]).length === 1 ? "finding" : "findings"}
                    </Text>
                    {(conv.intelCards as IntelCardType[]).map((card) => (
                      <IntelCard key={card.id} card={card} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.center}>
                  <Text style={styles.muted}>No intel cards found</Text>
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border as string,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minWidth: 70,
  },
  backLabel: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.regular,
    color: Colors.systemBlue as string,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontFamily: FontFamily.bold,
    color: Colors.foreground as string,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.mutedForeground as string,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondarySystemFill as string,
  },
  tabActive: {
    backgroundColor: Colors.primary as string,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.mutedForeground as string,
  },
  tabTextActive: {
    color: Colors.onColor,
  },
  summaryBanner: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: AnimationColors.searchFill,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: AnimationColors.searchBorder,
  },
  summaryText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.foreground as string,
    lineHeight: LineHeight.relaxed,
  },
  summaryMeta: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.tertiaryLabel as string,
  },
  collectedDataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  collectedDataChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.secondarySystemFill as string,
    borderRadius: Radius.md,
    gap: 2,
  },
  collectedDataLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.tertiaryLabel as string,
    textTransform: "capitalize",
  },
  collectedDataValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: Colors.foreground as string,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  muted: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.mutedForeground as string,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing["4xl"],
  },
  transcriptList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  intelSection: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: AnimationColors.searchFill,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    overflow: "hidden",
  },
  intelAccent: {
    width: 3,
    backgroundColor: AnimationColors.search,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  intelSectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: AnimationColors.search,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  bubbleUser: {
    backgroundColor: Colors.systemBlue as string,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: Colors.card as string,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.relaxed,
  },
  textUser: {
    color: Colors.onColor,
  },
  textAssistant: {
    color: Colors.foreground as string,
  },
  timestamp: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    alignSelf: "flex-end",
  },
  timestampUser: {
    color: OnImage.quaternary,
  },
  timestampAssistant: {
    color: Colors.tertiaryLabel as string,
  },
});
