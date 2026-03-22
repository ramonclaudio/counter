import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { env } from "@/lib/env";
import { getConversationToken } from "@/lib/elevenlabs";
import { haptics } from "@/lib/haptics";
import type { IntelCard, ConversationPhase, Message, FeedItem } from "@/lib/types";

export function useCounter() {
  const [intelCards, setIntelCards] = useState<IntelCard[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const updateIntelCardsMutation = useMutation(api.conversations.updateIntelCards);
  const updateTitle = useMutation(api.conversations.updateTitle);

  // Track convId in a ref so callbacks always see the latest value
  const convIdRef = useRef<Id<"conversations"> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedCountRef = useRef(0);
  const pendingContextRef = useRef<string | null>(null);

  useEffect(() => {
    feedCountRef.current = feedItems.length;
  }, [feedItems.length]);

  const clearSearchTimeout = () => clearTimeout(searchTimeoutRef.current);

  const conversation = useConversation({
    clientTools: {
      updateIntelCards: async (params: unknown) => {
        const { cards } = params as { cards: IntelCard[] };
        if (__DEV__) {
          console.log("[Counter] updateIntelCards received:", JSON.stringify(cards.map(c => ({
            id: c.id, type: c.type, title: c.title?.slice(0, 40),
            hasImage: !!c.imageUrl, hasFullValue: !!c.fullValue,
            highlightCount: c.highlights?.length ?? 0, priceCount: c.prices?.length ?? 0,
          }))));
        }
        // Server generates deterministic IDs, fallback for agent-generated cards
        const cardsWithIds = cards.map((c, i) => ({
          ...c,
          id: c.id || `${c.type || 'card'}-${Date.now()}-${i}`,
        }));
        setIntelCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newCards = cardsWithIds.filter((c) => !existingIds.has(c.id));
          const merged = [...prev, ...newCards];
          // Persist to Convex
          if (convIdRef.current) {
            updateIntelCardsMutation({
              conversationId: convIdRef.current,
              intelCards: merged,
            }).catch((e) => console.warn('[Counter] Sync failed:', e));
          }
          return merged;
        });
        setFeedItems((prev) => [...prev, { type: 'intel', cards: cardsWithIds, timestamp: Date.now() }]);
        clearSearchTimeout();
        setIsSearching(false);
        haptics.medium();
        return "Cards displayed";
      },
      setConversationPhase: async (params: unknown) => {
        const { phase } = params as { phase: string };
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
      setFeedItems([]);
      setError(null);
      // Inject context from previous session if available
      if (pendingContextRef.current) {
        const ctx = pendingContextRef.current;
        pendingContextRef.current = null;
        // Small delay to ensure WebRTC data channel is ready
        setTimeout(() => {
          try { conversation.sendContextualUpdate(ctx); }
          catch (e) { console.warn('[Counter] Context inject failed:', e); }
        }, 500);
      }
    },
    onDisconnect: () => {
      setConversationPhase("idle");
      clearSearchTimeout();
      setIsSearching(false);
    },
    onError: (message) => {
      console.error("[Counter] Error:", message);
      setError(typeof message === "string" ? message : "Connection error");
      clearSearchTimeout();
      setIsSearching(false);
    },
    onMessage: (message) => {
      if (__DEV__) console.log("[Counter] onMessage:", JSON.stringify(message));
      const role = (message as any).role ?? message.source;
      if ((role === "ai" || role === "assistant" || role === "agent") && typeof message.message === "string") {
        const lower = message.message.toLowerCase();
        // Detect search start: short messages with search-intent phrases
        const isShort = message.message.length < 150;
        if (isShort && (
          lower.includes("let me pull") ||
          lower.includes("let me dig") ||
          lower.includes("let me search") ||
          lower.includes("let me run") ||
          lower.includes("let me check") ||
          lower.includes("let me look") ||
          lower.includes("searching") ||
          lower.includes("looking up") ||
          lower.includes("digging into") ||
          (lower.includes("right now") && (lower.includes("dig") || lower.includes("search") || lower.includes("pull")))
        )) {
          clearSearchTimeout();
          searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 15000);
          setIsSearching(true);
        }
        // Clear searching when agent delivers long results or admits failure
        if (message.message.length > 200 || lower.includes("connection issues")) {
          clearSearchTimeout();
          setIsSearching(false);
        }
        const msg: Message = { role: "assistant", content: message.message, timestamp: Date.now() };
        setMessages((prev) => [...prev, msg]);
        setFeedItems((prev) => [...prev, { type: 'assistant-message', message: msg }]);
        if (convIdRef.current) {
          addMessage({ conversationId: convIdRef.current, role: "assistant", content: message.message }).catch((e) => console.warn('[Counter] Sync failed:', e));
        }
      } else if ((role === "user") && typeof message.message === "string") {
        const msg: Message = { role: "user", content: message.message, timestamp: Date.now() };
        setMessages((prev) => [...prev, msg]);
        setFeedItems((prev) => [...prev, { type: 'user-message', message: msg }]);
        if (convIdRef.current) {
          addMessage({ conversationId: convIdRef.current, role: "user", content: message.message }).catch((e) => console.warn('[Counter] Sync failed:', e));
        }
        // Auto-title from first user message
        if (feedCountRef.current === 0 && convIdRef.current) {
          updateTitle({ conversationId: convIdRef.current, title: message.message.slice(0, 60) })
            .catch((e) => console.warn('[Counter] Title update failed:', e));
        }
      }
    },
    onModeChange: () => {
      // isSearching is cleared only when results arrive via updateIntelCards
    },
    onStatusChange: ({ status }) => {
      if (status === "disconnected") {
        setConversationPhase("idle");
        clearSearchTimeout();
        setIsSearching(false);
      }
    },
  });

  const startSession = useCallback(async (context?: string) => {
    setError(null);
    pendingContextRef.current = context ?? null;
    const convId = await createConversation({ title: "Conversation" });
    setConversationId(convId);
    convIdRef.current = convId;
    const agentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) throw new Error("Missing EXPO_PUBLIC_ELEVENLABS_AGENT_ID");
    console.log("[Counter] Connecting to agent:", agentId, context ? "(with context)" : "");
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

  const sendTextMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      // Send to ElevenLabs agent via WebRTC
      try { conversation.sendUserMessage(text); }
      catch (e) { console.warn('[Counter] sendUserMessage failed:', e); }
      // Add to local state + persist (mirrors onMessage user handling)
      const msg: Message = { role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, msg]);
      setFeedItems((prev) => [...prev, { type: "user-message", message: msg }]);
      if (convIdRef.current) {
        addMessage({ conversationId: convIdRef.current, role: "user", content: text })
          .catch((e) => console.warn('[Counter] Sync failed:', e));
      }
      if (feedCountRef.current === 0 && convIdRef.current) {
        updateTitle({ conversationId: convIdRef.current, title: text.slice(0, 60) })
          .catch((e) => console.warn('[Counter] Title update failed:', e));
      }
    },
    [conversation, addMessage, updateTitle],
  );

  return {
    startSession,
    endSession,
    toggleMicMuted,
    sendTextMessage,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    intelCards,
    conversationPhase,
    isSearching,
    error,
    messages,
    feedItems,
    conversationId,
  };
}
