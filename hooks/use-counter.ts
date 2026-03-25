import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { getConversationToken } from "@/lib/elevenlabs";
import { haptics } from "@/lib/haptics";
import type { IntelCard, ConversationPhase, Message, FeedItem, SessionMode } from "@/lib/types";
import { MODE_CONFIGS } from "@/constants/modes";

export function useCounter() {
  const [intelCards, setIntelCards] = useState<IntelCard[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("research");

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const updateIntelCardsMutation = useMutation(api.conversations.updateIntelCards);
  const updateTitle = useMutation(api.conversations.updateTitle);
  const setElevenlabsId = useMutation(api.conversations.setElevenlabsId);

  // Track convId in a ref so callbacks always see the latest value
  const convIdRef = useRef<Id<"conversations"> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedCountRef = useRef(0);
  const pendingContextRef = useRef<string | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sessionModeRef = useRef<SessionMode>("research");

  useEffect(() => {
    feedCountRef.current = feedItems.length;
  }, [feedItems.length]);

  useEffect(() => {
    return () => {
      clearInterval(keepaliveRef.current);
      clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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
        const cardsWithIds = cards.map((c, i) => ({
          ...c,
          id: c.id || `${c.type || 'card'}-${Date.now()}-${i}`,
        }));
        // Stagger cards into the feed one at a time for perceived speed
        const STAGGER_MS = 150;
        for (let i = 0; i < cardsWithIds.length; i++) {
          const card = cardsWithIds[i];
          if (i > 0) await new Promise((r) => setTimeout(r, STAGGER_MS));
          setIntelCards((prev) => {
            if (prev.some((c) => c.id === card.id)) return prev;
            return [...prev, card];
          });
          setFeedItems((prev) => [...prev, { type: 'intel', cards: [card], timestamp: Date.now() + i }]);
          if (i === 0) haptics.success();
        }
        // Persist full set to Convex once
        setIntelCards((prev) => {
          if (convIdRef.current) {
            updateIntelCardsMutation({
              conversationId: convIdRef.current,
              intelCards: prev,
            }).catch((e) => console.warn('[Counter] Sync failed:', e));
          }
          return prev;
        });
        clearSearchTimeout();
        setIsSearching(false);
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
      // Save ElevenLabs conversation ID for post-call webhook matching
      try {
        const elId = conversation.getId();
        if (elId && convIdRef.current) {
          setElevenlabsId({ conversationId: convIdRef.current, elevenlabsConversationId: elId, sessionMode: sessionModeRef.current })
            .catch((e) => console.warn('[Counter] setElevenlabsId failed:', e));
        }
      } catch { /* getId may not be available yet */ }
      // Inject mode/context after WebRTC data channel stabilizes
      if (pendingContextRef.current) {
        const ctx = pendingContextRef.current;
        pendingContextRef.current = null;
        setTimeout(() => {
          try {
            if (conversation.status === "connected") {
              conversation.sendContextualUpdate(ctx);
            }
          } catch (e) {
            console.warn('[Counter] Context inject failed:', e);
          }
        }, 1500);
      }
      // Keepalive for live mode: send user activity every 25s to prevent turn timeout
      // In live mode, the user may be silent while the salesman is talking
      clearInterval(keepaliveRef.current);
      if (sessionModeRef.current === "live") {
        keepaliveRef.current = setInterval(() => {
          try { conversation.sendUserActivity(); }
          catch { /* session may have ended */ }
        }, 25000);
      }
    },
    onDisconnect: () => {
      setConversationPhase("idle");
      clearSearchTimeout();
      setIsSearching(false);
      clearInterval(keepaliveRef.current);
    },
    onError: (message) => {
      const msg = typeof message === "string" ? message : "";
      const isTransient =
        msg.includes("connection") ||
        msg.includes("websocket") ||
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("reset") ||
        msg === "" ||
        msg === "Connection error";
      if (isTransient) {
        // LiveKit handles reconnection internally, don't surface transport noise
        if (__DEV__) console.warn("[Counter] Transient error (suppressed):", message);
        return;
      }
      console.error("[Counter] Error:", message);
      setError(msg || "Connection error");
      clearSearchTimeout();
      setIsSearching(false);
    },
    onMessage: (message) => {
      if (__DEV__) console.log("[Counter] onMessage:", JSON.stringify(message));
      // Handle interrupted response corrections: update the last assistant message in feed
      const msgType = (message as any).type;
      if (msgType === "agent_response_correction" && typeof message.message === "string") {
        setFeedItems((prev) => {
          const items = [...prev];
          for (let i = items.length - 1; i >= 0; i--) {
            if (items[i].type === "assistant-message") {
              items[i] = { type: "assistant-message", message: { role: "assistant", content: message.message as string, timestamp: Date.now() } };
              break;
            }
          }
          return items;
        });
        return;
      }
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
          searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 30000);
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

  const startSession = useCallback(async (opts?: { context?: string; firstMessage?: string; mode?: SessionMode }) => {
    const mode = opts?.mode ?? "research";
    setSessionMode(mode);
    sessionModeRef.current = mode;
    setError(null);
    const modeConfig = MODE_CONFIGS[mode];
    // Send mode instructions + context via contextual update after connect (no overrides)
    const contextParts = [modeConfig.systemPrompt];
    if (opts?.context) contextParts.push(opts.context);
    pendingContextRef.current = contextParts.join("\n\n");
    const convId = await createConversation({ title: "Conversation" });
    setConversationId(convId);
    convIdRef.current = convId;
    const firstMsg = opts?.firstMessage ?? modeConfig.firstMessage;
    const overrides = { agent: { firstMessage: firstMsg } };
    // Use signed conversation token via Convex backend (never exposes API key client-side)
    const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
    if (siteUrl) {
      try {
        const token = await getConversationToken(siteUrl);
        console.log("[Counter] Connecting in", mode, "mode (token auth)");
        await conversation.startSession({ conversationToken: token, overrides });
        return;
      } catch (e) {
        console.warn("[Counter] Token auth failed, falling back to agentId:", e);
      }
    }
    // Fallback: public agent ID (dev only)
    const agentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) throw new Error("Missing EXPO_PUBLIC_ELEVENLABS_AGENT_ID and EXPO_PUBLIC_CONVEX_SITE_URL");
    console.log("[Counter] Connecting in", mode, "mode (public agent)");
    await conversation.startSession({ agentId, overrides });
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

  const sendFeedback = useCallback(
    (liked: boolean) => {
      try { conversation.sendFeedback(liked); }
      catch (e) { console.warn('[Counter] sendFeedback failed:', e); }
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
    sendFeedback,
    canSendFeedback: conversation.canSendFeedback,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    intelCards,
    conversationPhase,
    isSearching,
    error,
    messages,
    feedItems,
    conversationId,
    sessionMode,
  };
}
