import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "convex/react";
import { Pressable } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useColors } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { IntelCard } from "@/components/counter/intel-card";
import { Colors, OnImage, Radius, AnimationColors } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize } from "@/constants/layout";
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

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"transcript" | "intel">("transcript");
  const conv = useQuery(api.conversations.getConversation, {
    conversationId: id as Id<"conversations">,
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background as string }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
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
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tab, activeTab === "transcript" && styles.tabActive]}
              onPress={() => setActiveTab("transcript")}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "transcript" }}
            >
              <Text style={[styles.tabText, activeTab === "transcript" && styles.tabTextActive]}>
                Transcript
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "intel" && styles.tabActive]}
              onPress={() => setActiveTab("intel")}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "intel" }}
            >
              <Text style={[styles.tabText, activeTab === "intel" && styles.tabTextActive]}>
                Intel ({(conv.intelCards as IntelCardType[]).length})
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "transcript" ? (
              conv.messages.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.bubbles}>
                    {(conv.messages as Message[]).map((msg, i) => {
                      const isUser = msg.role === "user";
                      return (
                        <View key={i} style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
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
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.center}>
                  <Text style={styles.muted}>No messages yet</Text>
                </View>
              )
            ) : (conv.intelCards as IntelCardType[]).length > 0 ? (
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
        </>
      )}
    </SafeAreaView>
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
    color: Colors.systemBlue as string,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
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
    fontWeight: "600",
    color: Colors.mutedForeground as string,
  },
  tabTextActive: {
    color: Colors.onColor,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  muted: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing["4xl"],
  },
  section: {
    paddingTop: Spacing.lg,
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
    fontWeight: "700",
    color: AnimationColors.search,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  bubbles: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
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
    alignSelf: "flex-end",
  },
  timestampUser: {
    color: OnImage.quaternary,
  },
  timestampAssistant: {
    color: Colors.tertiaryLabel as string,
  },
});
