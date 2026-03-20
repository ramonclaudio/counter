import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react-native";

import { env } from "@/lib/env";
import { getConversationToken } from "@/lib/elevenlabs";
import { haptics } from "@/lib/haptics";
import type { IntelCard, ConversationPhase } from "@/lib/types";

export function useCounter() {
  const [intelCards, setIntelCards] = useState<IntelCard[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    clientTools: {
      updateIntelCards: async ({ cards }: { cards: IntelCard[] }) => {
        setIntelCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newCards = cards.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newCards];
        });
        setIsSearching(false);
        haptics.medium();
        return "Cards displayed";
      },
      setConversationPhase: async ({ phase }: { phase: string }) => {
        const validPhases: ConversationPhase[] = ["idle", "research", "coach", "advisor"];
        if (validPhases.includes(phase as ConversationPhase)) {
          setConversationPhase(phase as ConversationPhase);
        }
        return "Phase updated";
      },
    },
    onConnect: () => {
      setConversationPhase("research");
      setIntelCards([]);
      setError(null);
    },
    onDisconnect: () => {
      setConversationPhase("idle");
      setIsSearching(false);
    },
    onError: (message) => {
      console.error("[Counter] Error:", message);
      setError(typeof message === "string" ? message : "Connection error");
      setIsSearching(false);
    },
    onMessage: (message) => {
      if (message.source === "ai" && typeof message.message === "string") {
        const lower = message.message.toLowerCase();
        if (lower.includes("searching") || lower.includes("looking up") || lower.includes("let me check")) {
          setIsSearching(true);
        }
      }
    },
    onModeChange: ({ mode }) => {
      if (mode === "speaking") setIsSearching(false);
    },
    onStatusChange: ({ status }) => {
      if (status === "disconnected") {
        setConversationPhase("idle");
        setIsSearching(false);
      }
    },
  });

  const startSession = useCallback(async () => {
    setError(null);
    const token = await getConversationToken(env.convexSiteUrl);
    await conversation.startSession({ conversationToken: token });
  }, [conversation]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMicMuted = useCallback(
    (muted: boolean) => {
      conversation.setMicMuted(muted);
    },
    [conversation],
  );

  return {
    startSession,
    endSession,
    toggleMicMuted,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    intelCards,
    conversationPhase,
    isSearching,
    error,
  };
}
