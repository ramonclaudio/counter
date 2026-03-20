import type { IconSymbolName } from '@/components/ui/icon-symbol';
import { GOAL_CATEGORIES as _GOAL_CATEGORIES, type GoalCategory as _GoalCategory } from '@/convex/constants';

export {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LIST,
  CUSTOM_CATEGORY_ICONS,
  CUSTOM_CATEGORY_COLORS,
  LEVELS,
  getLevelFromXp,
  getXpToNextLevel,
} from '@/convex/constants';

export const CATEGORY_ICONS: Record<_GoalCategory, IconSymbolName> = {
  travel: 'airplane',
  money: 'creditcard.fill',
  career: 'briefcase.fill',
  lifestyle: 'house.fill',
  growth: 'leaf.fill',
  relationships: 'heart.fill',
  health: 'figure.walk',
  education: 'book.fill',
  creative: 'paintpalette.fill',
  social: 'globe',
  fitness: 'dumbbell.fill',
  family: 'figure.2.and.child.holdinghands',
  business: 'chart.bar.fill',
  hobbies: 'gamecontroller.fill',
  custom: 'star.fill',
};

export type { GoalCategory, Mood } from '@/convex/constants';

export function getCategoryConfig(goal: {
  category: string;
  customCategoryName?: string;
  customCategoryIcon?: string;
  customCategoryColor?: string;
}): { label: string; icon: string; color: string } {
  if (goal.category === 'custom') {
    return {
      label: goal.customCategoryName ?? 'Custom',
      icon: goal.customCategoryIcon ?? 'star.fill',
      color: goal.customCategoryColor ?? '#8E8E93',
    };
  }
  return _GOAL_CATEGORIES[goal.category as _GoalCategory] ?? _GOAL_CATEGORIES.growth;
}

export function getCategoryColor(
  config: { color?: string } | null | undefined,
): string {
  return config?.color ?? '#0088FF';
}
