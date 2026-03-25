import { registerGlobals } from "@livekit/react-native";

export { registerGlobals };

export async function getConversationToken(convexSiteUrl: string): Promise<string> {
  const secret = process.env.EXPO_PUBLIC_API_SECRET;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${convexSiteUrl}/getToken`, {
      method: 'POST',
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to get conversation token: ${res.status}`);
    const data = await res.json() as { conversationToken: string };
    return data.conversationToken;
  } finally {
    clearTimeout(timeout);
  }
}
