import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id, Doc } from './_generated/dataModel';
import { authComponent } from './auth';
import { XP_REWARDS, getLevelFromXp, FREE_MAX_GOALS } from './constants';
import { computeStreakUpdate } from './streak';
import { isPremiumUser } from './revenuecat';
import { checkAndAwardBadge, applyBadgeXp } from './badgeChecks';
import { getTodayString, getYesterdayString } from './dates';
import { calculateArchiveXpDeduction, calculateRestoreXpGain } from './goalGuards';
import { createDefaultProgress } from './progress';

const getAuthUserId = async (ctx: QueryCtx | MutationCtx) =>
  (await authComponent.safeGetAuthUser(ctx))?._id ?? null;

export const requireAuth = async (ctx: QueryCtx | MutationCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Unauthorized');
  return userId;
};

export const getOwnedGoal = async (ctx: MutationCtx, id: Id<'goals'>, userId: string) => {
  const goal = await ctx.db.get(id);
  if (!goal) throw new Error('Goal not found');
  if (goal.userId !== userId) throw new Error('Forbidden');
  return goal;
};

const ON_FIRE_STREAK_THRESHOLD = 7;

export async function awardXp(
  ctx: MutationCtx,
  userId: string,
  xpReward: number,
  opts?: {
    skipStreak?: boolean;
    incrementActions?: number;
    incrementGoals?: number;
    timezone?: string;
  }
): Promise<{
  xpAwarded: number;
  newStreak: number;
  streakMilestone: { streak: number; xpReward: number } | null;
}> {
  const tz = opts?.timezone ?? 'UTC';

  const existingProgress = await ctx.db
    .query('userProgress')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  if (!existingProgress) {
    const newStreak = opts?.skipStreak ? 0 : 1;
    await ctx.db.insert('userProgress', {
      ...createDefaultProgress(userId, {
        totalXp: xpReward,
        level: getLevelFromXp(xpReward).level,
        currentStreak: newStreak,
        longestStreak: newStreak,
        actionsCompleted: opts?.incrementActions ?? 0,
        goalsCompleted: opts?.incrementGoals ?? 0,
        timezone: tz,
      }),
    });
    return { xpAwarded: xpReward, newStreak, streakMilestone: null };
  }

  const progress = existingProgress;
  const today = getTodayString(tz);
  const yesterday = getYesterdayString(tz);
  const skipStreak = opts?.skipStreak ?? false;

  const streak = computeStreakUpdate(progress, today, yesterday, skipStreak);
  const newXp = progress.totalXp + xpReward + streak.milestoneXp;

  const patch: Record<string, unknown> = {
    ...streak.patch,
    totalXp: newXp,
    level: getLevelFromXp(newXp).level,
    lastActiveDate: today,
  };

  if (opts?.incrementActions) {
    patch.actionsCompleted = progress.actionsCompleted + opts.incrementActions;
  }
  if (opts?.incrementGoals) {
    patch.goalsCompleted = progress.goalsCompleted + opts.incrementGoals;
  }

  await ctx.db.patch(progress._id, patch);

  const newLevel = getLevelFromXp(newXp).level;
  let badgeXp = 0;
  if (!skipStreak && streak.newStreak >= ON_FIRE_STREAK_THRESHOLD) {
    const badgeResult = await checkAndAwardBadge(ctx, userId, 'on_fire');
    badgeXp += badgeResult.xpAwarded;
  }
  await applyBadgeXp(ctx, userId, badgeXp);

  return {
    xpAwarded: xpReward + streak.milestoneXp + badgeXp,
    newStreak: streak.newStreak,
    streakMilestone: streak.streakMilestone,
  };
}

export async function assertGoalLimit(ctx: MutationCtx, userId: string) {
  const isPremium = await isPremiumUser(ctx, userId);
  if (isPremium) return;

  const activeGoals = await ctx.db
    .query('goals')
    .withIndex('by_user_status', (q) => q.eq('userId', userId).eq('status', 'active'))
    .take(FREE_MAX_GOALS + 1);

  if (activeGoals.length >= FREE_MAX_GOALS) {
    throw new Error('FREE_GOAL_LIMIT');
  }
}

export async function deductXp(
  ctx: MutationCtx,
  userId: string,
  amount: number,
  opts?: { decrementActions?: number; decrementGoals?: number }
) {
  const progress = await ctx.db
    .query('userProgress')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
  if (!progress || amount <= 0) return;

  const newXp = Math.max(0, progress.totalXp - amount);
  const patch: Record<string, unknown> = {
    totalXp: newXp,
    level: getLevelFromXp(newXp).level,
  };
  if (opts?.decrementActions) {
    patch.actionsCompleted = Math.max(0, progress.actionsCompleted - opts.decrementActions);
  }
  if (opts?.decrementGoals) {
    patch.goalsCompleted = Math.max(0, progress.goalsCompleted - opts.decrementGoals);
  }
  await ctx.db.patch(progress._id, patch);
}

export async function deductGoalXp(
  ctx: MutationCtx,
  userId: string,
  goal: Doc<'goals'>,
  actions: Doc<'actions'>[]
) {
  const completedActionsCount = actions.filter((a) => a.isCompleted).length;
  const xpToDeduct = calculateArchiveXpDeduction(completedActionsCount, goal.status as 'active' | 'completed' | 'archived');
  const goalsToDeduct = goal.status === 'completed' ? 1 : 0;

  if (xpToDeduct > 0) {
    await deductXp(ctx, userId, xpToDeduct, {
      decrementActions: completedActionsCount,
      decrementGoals: goalsToDeduct,
    });
  }

  return xpToDeduct;
}

export async function restoreGoalXp(
  ctx: MutationCtx,
  userId: string,
  goal: Doc<'goals'>,
  actions: Doc<'actions'>[]
) {
  const completedActionsCount = actions.filter((a) => a.isCompleted).length;
  const xpToRestore = calculateRestoreXpGain(completedActionsCount, !!goal.completedAt);
  const goalsToRestore = goal.completedAt ? 1 : 0;

  const progress = await ctx.db
    .query('userProgress')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  if (progress && xpToRestore > 0) {
    const newXp = progress.totalXp + xpToRestore;
    await ctx.db.patch(progress._id, {
      totalXp: newXp,
      level: getLevelFromXp(newXp).level,
      actionsCompleted: progress.actionsCompleted + completedActionsCount,
      goalsCompleted: progress.goalsCompleted + goalsToRestore,
    });
  }

  return xpToRestore;
}
