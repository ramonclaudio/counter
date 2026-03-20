export type IntelCardType = 'price' | 'warning' | 'alternative' | 'leverage';

export type IntelCard = {
  id: string;
  type: IntelCardType;
  title: string;
  value: string;
  source: string;
  sourceUrl?: string;
};

export type ConversationPhase = 'idle' | 'research' | 'coach' | 'advisor';

export type SearchResult = {
  url: string;
  title: string;
  description: string;
  markdown?: string;
};
