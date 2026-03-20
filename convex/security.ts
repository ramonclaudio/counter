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
    // Cache is shared across users for same query hash; readable by anyone authenticated
    read: async ({ user }) => user !== '',
    modify: async ({ user }) => user !== '',
    insert: async ({ user }) => user !== '',
  },
  sessions: ownerRules(),
  conversations: ownerRules(),
};
