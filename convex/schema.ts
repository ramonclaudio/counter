import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  goalCategoryValidator,
  goalStatusValidator,
  moodValidator,
  pinTypeValidator,
} from './constants';

export default defineSchema({
  goals: defineTable({
    userId: v.string(),
    title: v.string(),
    category: goalCategoryValidator,
    whyItMatters: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    status: goalStatusValidator,
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    reflection: v.optional(v.string()),
    customCategoryName: v.optional(v.string()),
    customCategoryIcon: v.optional(v.string()),
    customCategoryColor: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_category', ['userId', 'category'])
    .index('by_status_completedAt', ['status', 'completedAt']),

  actions: defineTable({
    userId: v.string(),
    goalId: v.id('goals'),
    text: v.string(),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    deadline: v.optional(v.number()),
    deadlineNotifiedAt: v.optional(v.number()),
    reminder: v.optional(v.number()),
    reminderSentAt: v.optional(v.number()),
    order: v.number(),
    status: v.optional(v.union(v.literal('active'), v.literal('archived'))),
    createdAt: v.number(),
  })
    .index('by_goal', ['goalId'])
    .index('by_user', ['userId'])
    .index('by_user_completed', ['userId', 'isCompleted'])
    .index('by_reminder', ['isCompleted', 'reminder']),

  userProgress: defineTable({
    userId: v.string(),
    totalXp: v.number(),
    level: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDate: v.string(),
    goalsCompleted: v.number(),
    actionsCompleted: v.number(),
    streakMilestones: v.optional(v.array(v.number())),
  }).index('by_user', ['userId']),

  pushTokens: defineTable({
    userId: v.string(),
    token: v.string(),
    platform: v.literal('ios'),
    deviceId: v.optional(v.string()),
    lastUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_token', ['token']),

  pushReceipts: defineTable({
    ticketId: v.string(),
    token: v.string(),
    status: v.union(v.literal('pending'), v.literal('ok'), v.literal('error')),
    error: v.optional(v.string()),
    createdAt: v.number(),
    checkedAt: v.optional(v.number()),
  })
    .index('by_ticket', ['ticketId'])
    .index('by_status', ['status'])
    .index('by_token', ['token']),

  userPreferences: defineTable({
    userId: v.string(),
    onboardingCompleted: v.boolean(),
    selectedCategories: v.array(goalCategoryValidator),
    notificationTime: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  journalEntries: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    mood: v.optional(moodValidator),
    goalId: v.optional(v.id('goals')),
    tags: v.optional(v.array(v.string())),
    date: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_date', ['userId', 'date'])
    .index('by_goal', ['goalId']),

  focusSessions: defineTable({
    userId: v.string(),
    goalId: v.optional(v.id('goals')),
    actionId: v.optional(v.id('actions')),
    duration: v.number(),
    completedAt: v.number(),
    mood: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_completedAt', ['userId', 'completedAt'])
    .index('by_goal', ['goalId']),

  userBadges: defineTable({
    userId: v.string(),
    badgeKey: v.string(),
    earnedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_badge', ['userId', 'badgeKey']),

  uploadRateLimit: defineTable({
    userId: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  pushNotificationRateLimit: defineTable({
    userId: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  userProfiles: defineTable({
    userId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    avatarHidden: v.optional(v.boolean()),
    bannerStorageId: v.optional(v.id('_storage')),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_username', ['username'])
    .index('by_public_username', ['isPublic', 'username']),

  communityRateLimit: defineTable({
    userId: v.string(),
    action: v.string(),
    createdAt: v.number(),
  }).index('by_user_action', ['userId', 'action']),

  visionBoards: defineTable({
    userId: v.string(),
    name: v.string(),
    order: v.number(),
    createdAt: v.number(),
  }).index('by_user_order', ['userId', 'order']),

  pins: defineTable({
    userId: v.string(),
    type: pinTypeValidator,
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(goalCategoryValidator),
    tags: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.id('_storage')),
    imageAspectRatio: v.optional(v.number()),
    boardId: v.optional(v.id('visionBoards')),
    goalId: v.optional(v.id('goals')),
    isPersonalOnly: v.boolean(),
    isHidden: v.optional(v.boolean()),
    customCategoryName: v.optional(v.string()),
    customCategoryIcon: v.optional(v.string()),
    customCategoryColor: v.optional(v.string()),
    originalPinId: v.optional(v.id('pins')),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user_created', ['userId', 'createdAt'])
    .index('by_board', ['boardId', 'createdAt'])
    .index('by_community_created', ['isPersonalOnly', 'createdAt'])
    .index('by_category_created', ['category', 'createdAt'])
    .index('by_goal_created', ['goalId', 'createdAt']),

  pinReports: defineTable({
    pinId: v.id('pins'),
    reporterId: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_pin', ['pinId'])
    .index('by_reporter_pin', ['reporterId', 'pinId']),

  blockedUsers: defineTable({
    blockerId: v.string(),
    blockedId: v.string(),
    createdAt: v.number(),
  })
    .index('by_blocker', ['blockerId'])
    .index('by_pair', ['blockerId', 'blockedId']),

  userReports: defineTable({
    reportedId: v.string(),
    reporterId: v.string(),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_reported', ['reportedId'])
    .index('by_reporter_reported', ['reporterId', 'reportedId']),

});
