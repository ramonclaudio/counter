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
  goals: ownerRules(),
  actions: ownerRules(),
  journalEntries: ownerRules(),
  userProgress: ownerRules(),
  userPreferences: ownerRules(),
  userBadges: ownerRules(),
  uploadRateLimit: ownerRules(),
  pushTokens: ownerRules(),
  pushNotificationRateLimit: ownerRules(),
  focusSessions: ownerRules(),
  communityRateLimit: ownerRules(),

  userProfiles: {
    read: async ({ user }, doc) => doc.userId === user || doc.isPublic,
    modify: async ({ user }, doc) => doc.userId === user,
    insert: async ({ user }, doc) => doc.userId === user,
  },

  visionBoards: ownerRules(),

  pins: {
    read: async ({ user }, doc) => doc.userId === user || (!doc.isPersonalOnly && !doc.isHidden),
    modify: async ({ user }, doc) => doc.userId === user,
    insert: async ({ user }, doc) => doc.userId === user,
  },
  pinReports: ownerRules('reporterId'),
  blockedUsers: ownerRules('blockerId'),
  userReports: ownerRules('reporterId'),

};
