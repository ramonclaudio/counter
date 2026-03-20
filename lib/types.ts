export type IntelCardType = 'price' | 'warning' | 'alternative' | 'leverage';

export type IntelCard = {
  id: string;
  type: IntelCardType;
  title: string;
  value: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  prices?: string[];
  siteName?: string;
  faviconUrl?: string;
};

export type ConversationPhase = 'idle' | 'research' | 'coach' | 'advisor';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};
