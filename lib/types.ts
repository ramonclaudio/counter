export type IntelCardType = 'price' | 'warning' | 'alternative' | 'leverage';

export type IntelCard = {
  id: string;
  type: IntelCardType;
  title: string;
  value: string;
  fullValue?: string;
  highlights?: string[];
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  prices?: string[];
  siteName?: string;
  faviconUrl?: string;
  date?: string;
};

export type ConversationPhase = 'idle' | 'research' | 'coach' | 'advisor';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type FeedItem =
  | { type: 'user-message'; message: Message }
  | { type: 'assistant-message'; message: Message }
  | { type: 'intel'; cards: IntelCard[]; timestamp: number }
  | { type: 'searching'; timestamp: number };
