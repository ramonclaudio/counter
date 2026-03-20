import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { env } from "@/lib/env";
import { getConversationToken } from "@/lib/elevenlabs";
import { haptics } from "@/lib/haptics";
import type { IntelCard, ConversationPhase, Message } from "@/lib/types";

export function useCounter() {
  const [intelCards, setIntelCards] = useState<IntelCard[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const updateIntelCardsMutation = useMutation(api.conversations.updateIntelCards);

  // Track convId in a ref so callbacks always see the latest value
  const convIdRef = useRef<Id<"conversations"> | null>(null);

  const conversation = useConversation({
    clientTools: {
      updateIntelCards: async ({ cards }: { cards: IntelCard[] }) => {
        setIntelCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newCards = cards.filter((c) => !existingIds.has(c.id));
          const merged = [...prev, ...newCards];
          // Persist to Convex
          if (convIdRef.current) {
            updateIntelCardsMutation({
              conversationId: convIdRef.current,
              intelCards: merged,
            }).catch(() => {});
          }
          return merged;
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
      setMessages([]);
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
      if (__DEV__) console.log("[Counter] onMessage:", JSON.stringify(message));
      const role = (message as any).role ?? message.source;
      if ((role === "ai" || role === "assistant") && typeof message.message === "string") {
        const lower = message.message.toLowerCase();
        if (lower.includes("searching") || lower.includes("looking up") || lower.includes("let me check")) {
          setIsSearching(true);
        }
        const msg: Message = { role: "assistant", content: message.message, timestamp: Date.now() };
        setMessages((prev) => [...prev, msg]);
        if (convIdRef.current) {
          addMessage({ conversationId: convIdRef.current, role: "assistant", content: message.message }).catch(() => {});
        }
      } else if ((role === "user") && typeof message.message === "string") {
        const msg: Message = { role: "user", content: message.message, timestamp: Date.now() };
        setMessages((prev) => [...prev, msg]);
        if (convIdRef.current) {
          addMessage({ conversationId: convIdRef.current, role: "user", content: message.message }).catch(() => {});
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
    // Create a Convex conversation doc before connecting
    const convId = await createConversation({ title: "Conversation" });
    setConversationId(convId);
    convIdRef.current = convId;
    // Use agentId directly (public agent, simpler than token flow)
    const agentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) throw new Error("Missing EXPO_PUBLIC_ELEVENLABS_AGENT_ID");
    console.log("[Counter] Connecting to agent:", agentId);
    await conversation.startSession({ agentId });
  }, [conversation, createConversation]);

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
    messages,
    conversationId,
  };
}
