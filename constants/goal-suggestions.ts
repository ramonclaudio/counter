import type { GoalCategory } from '@/constants/goals';

export const TITLE_SUGGESTIONS: Record<GoalCategory, string[]> = {
  travel: [
    'Solo trip to Japan',
    'Visit 5 new countries',
    'Take a sabbatical or career break',
    'Road trip across the coast',
    'Learn to surf',
    'Backpack through Europe',
  ],
  money: [
    'Save $10K emergency fund',
    'Max out my 401K',
    'Start investing in index funds',
    'Pay off student loans',
    'Build 3 streams of income',
    'Hit $100K net worth',
  ],
  career: [
    'Launch my side business',
    'Get promoted to senior role',
    'Build a personal brand online',
    'Start freelancing on the side',
    'Negotiate a 20% raise',
    'Speak at a conference',
  ],
  lifestyle: [
    'Build a consistent gym habit',
    'Meal prep every Sunday',
    'Sleep 8 hours consistently',
    'Create a minimalist wardrobe',
    'Design my ideal home office',
    'Master a new recipe weekly',
  ],
  growth: [
    'Read 24 books this year',
    'Learn a new language',
    'Start a daily meditation practice',
    'Take a public speaking course',
    'Write in my journal every day',
    'Complete a coding bootcamp',
  ],
  relationships: [
    'Host monthly friend dinners',
    'Call family every week',
    'Find my community',
    'Set better boundaries',
    'Be more vulnerable',
    'Plan weekly date nights',
  ],
  health: [
    'Run a half marathon',
    'Build a consistent gym habit',
    'Meal prep every Sunday',
    'Sleep 8 hours consistently',
    'Try a new sport',
    'Complete a 30-day fitness challenge',
  ],
  education: [
    'Complete a coding bootcamp',
    'Get a professional certification',
    'Learn a new language',
    'Take an online course every month',
    'Read 24 books this year',
    'Earn a degree or diploma',
  ],
  creative: [
    'Write a book or short story',
    'Start a podcast or YouTube channel',
    'Learn to paint or draw',
    'Perform at an open mic',
    'Build a portfolio of my work',
    'Launch a creative side project',
  ],
  social: [
    'Volunteer every month',
    'Mentor someone in my field',
    'Organize a community event',
    'Start a fundraiser for a cause I love',
    'Join a local nonprofit board',
    'Donate to a cause monthly',
  ],
  fitness: [
    'Run a 5K or 10K race',
    'Build a consistent gym routine',
    'Complete a 30-day fitness challenge',
    'Train for a half marathon',
    'Learn a new sport',
    'Hit a personal record in the gym',
  ],
  family: [
    'Plan a family trip every year',
    'Create a weekly family ritual',
    'Be more present with my kids',
    'Strengthen my relationship with my parents',
    'Start a family tradition',
    'Write letters to the people I love',
  ],
  business: [
    'Launch my first product or service',
    'Build a profitable side hustle',
    'Get my first 10 paying customers',
    'Start a business with $0 in debt',
    'Grow revenue to $10K/month',
    'Build a team and delegate',
  ],
  hobbies: [
    'Master a musical instrument',
    'Build something with my hands',
    'Get good at photography',
    'Complete a personal creative project',
    'Join a local club or group',
    'Dedicate 1 hour a week to a passion',
  ],
  custom: [],
};

export const ACTION_SUGGESTIONS: Record<GoalCategory, string[]> = {
  travel: ['Book a trip', 'Get a passport', 'Research destinations', 'Save for trip fund'],
  money: ['Set a budget', 'Open savings account', 'Track expenses', 'Find side income'],
  career: ['Update resume', 'Network with peers', 'Learn a new skill', 'Set career goals'],
  lifestyle: ['Start a morning routine', 'Declutter my space', 'Try a new hobby', 'Plan a self-care day'],
  growth: ['Read a book', 'Start journaling', 'Take an online course', 'Practice mindfulness'],
  relationships: ['Plan a date night', 'Call an old friend', 'Write a gratitude letter', 'Join a community'],
  health: ['Schedule a workout', 'Prep healthy meals', 'Book a health checkup', 'Try a new fitness class'],
  education: ['Enroll in a course', 'Read for 30 minutes', 'Practice a new skill', 'Research programs'],
  creative: ['Sketch or write daily', 'Start a creative project', 'Share my work online', 'Take a class'],
  social: ['Sign up to volunteer', 'Donate to a cause', 'Mentor someone', 'Attend a community event'],
  fitness: ['Schedule a workout', 'Find a training partner', 'Sign up for a race', 'Track my progress'],
  family: ['Plan a family outing', 'Call a family member', 'Start a family tradition', 'Be more present'],
  business: ['Validate my business idea', 'Build a landing page', 'Find my first customer', 'Set revenue goals'],
  hobbies: ['Dedicate time each week', 'Find a community', 'Set a skill milestone', 'Document my progress'],
  custom: [],
};

export type TimelineUnit = 'days' | 'weeks' | 'months' | 'years';

export interface TimelineDuration {
  amount: number;
  unit: TimelineUnit;
}

export const TIMELINE_UNITS: TimelineUnit[] = ['days', 'weeks', 'months', 'years'];

export const TIMELINE_PRESETS: TimelineDuration[] = [
  { amount: 1, unit: 'weeks' },
  { amount: 1, unit: 'months' },
  { amount: 3, unit: 'months' },
  { amount: 6, unit: 'months' },
  { amount: 1, unit: 'years' },
];

const SINGULAR_UNITS: Record<TimelineUnit, string> = {
  days: 'day',
  weeks: 'week',
  months: 'month',
  years: 'year',
};

export function formatDuration(duration: TimelineDuration): string {
  const unit = duration.amount === 1 ? SINGULAR_UNITS[duration.unit] : duration.unit;
  return `${duration.amount} ${unit}`;
}

export function durationToEpoch(duration: TimelineDuration): number {
  const now = new Date();
  switch (duration.unit) {
    case 'days':
      now.setDate(now.getDate() + duration.amount);
      break;
    case 'weeks':
      now.setDate(now.getDate() + duration.amount * 7);
      break;
    case 'months':
      now.setMonth(now.getMonth() + duration.amount);
      break;
    case 'years':
      now.setFullYear(now.getFullYear() + duration.amount);
      break;
  }
  return now.getTime();
}

export const IDENTITY_SUGGESTIONS = [
  'more confident',
  'financially free',
  'a world traveler',
  'healthier',
  'more creative',
  'a leader',
] as const;
