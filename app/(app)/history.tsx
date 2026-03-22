import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { api } from "@/convex/_generated/api";
import { useColors } from "@/hooks/use-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, LineHeight, IconSize } from "@/constants/layout";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function HistoryScreen() {
  const colors = useColors();
  const conversations = useQuery(api.conversations.listConversations);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background as string }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
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
          <IconSymbol name="waveform" size={IconSize["2xl"]} color={Colors.tertiaryLabel as string} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>Tap Start to research your first deal</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {conversations.map((conv) => (
            <Pressable
              key={conv._id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/(app)/conversation/${conv._id}`)}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>{conv.title}</Text>
                <Text style={styles.rowMeta}>
                  {conv.messageCount} {conv.messageCount === 1 ? "message" : "messages"}
                </Text>
              </View>
              <Text style={styles.rowDate}>{formatDate(conv.updatedAt)}</Text>
              <IconSymbol name="chevron.right" size={IconSize.sm} color={Colors.tertiaryLabel as string} />
            </Pressable>
          ))}
        </ScrollView>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground as string,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border as string,
  },
  rowPressed: {
    backgroundColor: Colors.secondarySystemFill as string,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: FontSize.base,
    fontWeight: "500",
    color: Colors.foreground as string,
    lineHeight: LineHeight.base,
  },
  rowMeta: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground as string,
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
});
