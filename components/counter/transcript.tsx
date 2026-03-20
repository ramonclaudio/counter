import { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Colors, Radius } from "@/constants/theme";
import { Spacing, FontSize, LineHeight } from "@/constants/layout";
import type { Message } from "@/lib/types";

type Props = {
  messages: Message[];
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Transcript({ messages }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Say something to start the conversation.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <View key={i} style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
                {msg.content}
              </Text>
              <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["4xl"],
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.tertiaryLabel as string,
    textAlign: "center",
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
  text: {
    fontSize: FontSize.base,
    lineHeight: LineHeight.relaxed,
  },
  textUser: {
    color: "#FFFFFF",
  },
  textAssistant: {
    color: Colors.foreground as string,
  },
  timestamp: {
    fontSize: FontSize.xs,
    alignSelf: "flex-end",
  },
  timestampUser: {
    color: "rgba(255,255,255,0.65)",
  },
  timestampAssistant: {
    color: Colors.tertiaryLabel as string,
  },
});
