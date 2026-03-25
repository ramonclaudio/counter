import { useCallback, useEffect } from "react";
import { View, Text, Pressable, Share, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { Link, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/use-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, AnimationColors } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize } from "@/constants/layout";
import { haptics } from "@/lib/haptics";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function BreathingIcon() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <IconSymbol name="waveform" size={IconSize["2xl"]} color={Colors.tertiaryLabel as string} />
    </Animated.View>
  );
}

function dotColor(intelCount: number): string {
  if (intelCount >= 4) return Colors.systemGreen as string;
  if (intelCount >= 1) return Colors.systemBlue as string;
  return Colors.systemGray as string;
}

function DotIndicator({ intelCount }: { intelCount: number }) {
  const color = dotColor(intelCount);
  return (
    <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
  );
}

function IntelBadge({ count }: { count: number }) {
  return (
    <View style={styles.intelBadge}>
      <IconSymbol name="magnifyingglass" size={IconSize.sm - 2} color={AnimationColors.search} />
      <Text style={styles.intelBadgeText}>
        {count} {count === 1 ? "card" : "cards"}
      </Text>
    </View>
  );
}

type Conversation = NonNullable<ReturnType<typeof useQuery<typeof api.conversations.listConversations>>>[number];

const keyExtractor = (item: Conversation) => item._id;

export default function HistoryScreen() {
  const colors = useColors();
  const conversations = useQuery(api.conversations.listConversations);

  const renderConversation = useCallback(({ item: conv }: ListRenderItemInfo<Conversation>) => (
    <Animated.View entering={FadeIn.duration(300)}>
      <Link href={`/(app)/conversation/${conv._id}`}>
        <Link.Trigger>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => haptics.light()}
            accessibilityLabel={"Conversation: " + conv.title}
          >
            <View style={styles.zoomSource}>
              <DotIndicator intelCount={conv.intelCount} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>{conv.title}</Text>
                {conv.preview ? (
                  <Text style={styles.rowPreview} numberOfLines={1}>{conv.preview}</Text>
                ) : null}
                <View style={styles.rowMetaRow}>
                  <Text style={styles.rowMeta}>
                    {conv.messageCount} {conv.messageCount === 1 ? "msg" : "msgs"}
                  </Text>
                  {conv.intelCount > 0 ? <IntelBadge count={conv.intelCount} /> : null}
                </View>
              </View>
              <Text style={styles.rowDate}>{formatDate(conv.updatedAt)}</Text>
              <IconSymbol name="chevron.right" size={IconSize.sm} color={Colors.tertiaryLabel as string} />
            </View>
          </Pressable>
        </Link.Trigger>
        <Link.Preview>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{conv.title}</Text>
            {conv.preview ? (
              <Text style={styles.previewText} numberOfLines={3}>{conv.preview}</Text>
            ) : null}
            <View style={styles.previewMeta}>
              <Text style={styles.previewMetaText}>
                {conv.messageCount} {conv.messageCount === 1 ? "msg" : "msgs"}
              </Text>
              {conv.intelCount > 0 ? <IntelBadge count={conv.intelCount} /> : null}
            </View>
          </View>
        </Link.Preview>
        <Link.Menu>
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              haptics.light();
              Share.share({ message: conv.title });
            }}
          />
          <Link.MenuAction
            title="Copy Title"
            icon="doc.on.doc"
            onPress={() => {
              haptics.light();
              Clipboard.setStringAsync(conv.title);
            }}
          />
        </Link.Menu>
      </Link>
    </Animated.View>
  ), []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background as string }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconSymbol name="chevron.left" size={IconSize.xl} color={Colors.systemBlue as string} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>History</Text>
        <View style={styles.backButton} />
      </View>

      {conversations === undefined ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <Skeleton width="70%" height={FontSize.base} />
                <Skeleton width="40%" height={FontSize.sm} />
              </View>
              <Skeleton width={50} height={FontSize.sm} />
            </View>
          ))}
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <BreathingIcon />
          <Text style={styles.emptyTitle}>What deal are you hunting?</Text>
          <Text style={styles.emptySubtitle}>Start a conversation to get real-time intel</Text>
        </View>
      ) : (
        <FlashList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
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
    minWidth: 60,
  },
  backLabel: {
    fontSize: FontSize.xl,
    color: Colors.systemBlue as string,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground as string,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border as string,
  },
  rowPressed: {
    backgroundColor: Colors.secondarySystemFill as string,
  },
  zoomSource: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.foreground as string,
    lineHeight: LineHeight.base,
  },
  rowPreview: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    lineHeight: LineHeight.tight,
  },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 1,
  },
  rowMeta: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground as string,
  },
  intelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: AnimationColors.searchFill,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  intelBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    color: AnimationColors.search,
  },
  rowDate: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
  },
  skeletonList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.lg },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.md },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.foreground as string },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.mutedForeground as string },
  previewContainer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  previewTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.foreground as string,
    lineHeight: LineHeight.base + 4,
  },
  previewText: {
    fontSize: FontSize.base,
    color: Colors.tertiaryLabel as string,
    lineHeight: LineHeight.base,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  previewMetaText: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground as string,
  },
});
