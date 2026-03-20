import { registerGlobals } from "@livekit/react-native";

export { registerGlobals };

export async function getConversationToken(convexSiteUrl: string): Promise<string> {
  const res = await fetch(`${convexSiteUrl}/getToken`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to get conversation token: ${res.status}`);
  const data = await res.json() as { conversationToken: string };
  return data.conversationToken;
}
