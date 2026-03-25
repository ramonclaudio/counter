import type { Rules } from 'convex-helpers/server/rowLevelSecurity';
import type { DataModel } from './_generated/dataModel';

export type RLSCtx = { user: string };

function ownerRules(field = 'userId') {
  return {
    read: async ({ user }: RLSCtx, doc: Record<string, unknown>) => doc[field] === user,
    modify: async ({ user }: RLSCtx, doc: Record<string, unknown>) => doc[field] === user,
    insert: async ({ user }: RLSCtx, doc: Record<string, unknown>) => doc[field] === user,
  };
}

export const rules: Rules<RLSCtx, DataModel> = {
  searchCache: {
    read: async () => false,
    modify: async () => false,
    insert: async () => false,
  },
  sessions: ownerRules(),
  sessionLeverage: ownerRules(),
  messages: ownerRules(),
  conversations: ownerRules(),
};
