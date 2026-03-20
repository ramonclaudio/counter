export const Opacity = {
  pressed: 0.7,
  active: 0.8,
  disabled: 0.5,
  muted: 0.6,
} as const;

export const ZIndex = {
  offlineBanner: 1000,
} as const;

export const Duration = {
  normal: 200,
  splash: 1000,
} as const;

export const Size = {
  checkbox: 24,
  divider: 0.5,
  dividerThick: 1,
  dividerMargin: 50,
} as const;

export const Responsive = {
  avatar: {
    phone: 100,
    tablet: 110,
    desktop: 120,
  },
} as const;

const HypeCopy = {
  achievement: [
    'You did it.',
    'You built this.',
    'You showed up.',
    'Goal complete.',
    'Well done.',
  ],
  levelUp: [
    'You leveled up.',
    'Keep going.',
    'Progress.',
    'One level higher.',
  ],
  badge: [
    'Earned.',
    'Another one.',
    'Well deserved.',
    'Added to your collection.',
  ],
  actionComplete: [
    'Done.', 'Checked.', 'One less thing.', "That's progress.", 'Handled.', 'One step closer.',
  ],
  allDone: [
    'All done.', 'Clean slate.', 'Go live your life.', 'Nothing left today.',
  ],
  firstAction: [
    'First step taken.', 'You started.', 'It begins.', 'The hardest step is the first.',
  ],
} as const;

export type HypeCategory = keyof typeof HypeCopy;

export function pickHype(category: HypeCategory): string {
  const lines = HypeCopy[category];
  return lines[Math.floor(Math.random() * lines.length)];
}

export const Accessibility = {
  maxFontSizeMultiplier: 2,
} as const;
