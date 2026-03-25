import { Color } from 'expo-router';
import { DynamicColorIOS } from 'react-native';

import { FontFamily } from '@/constants/layout';

export const ShadowColor = '#000000' as const;

export const HeaderTint = Color.ios.label;

export const Scrim = {
  light:  'rgba(0,0,0,0.25)',
  medium: 'rgba(0,0,0,0.35)',
  heavy:  'rgba(0,0,0,0.45)',
} as const;

export const OnImage = {
  primary:    '#FFFFFF',
  secondary:  'rgba(255,255,255,0.9)',
  tertiary:   'rgba(255,255,255,0.8)',
  quaternary: 'rgba(255,255,255,0.6)',
  dim:        'rgba(255,255,255,0.25)',
} as const;

export const Colors = {
  background:                 Color.ios.systemBackground,
  card:                       Color.ios.secondarySystemBackground,
  popover:                    Color.ios.tertiarySystemBackground,
  muted:                      Color.ios.secondarySystemBackground,
  secondary:                  Color.ios.secondarySystemBackground,
  groupedBackground:          Color.ios.systemGroupedBackground,
  secondaryGroupedBackground: Color.ios.secondarySystemGroupedBackground,
  tertiaryGroupedBackground:  Color.ios.tertiarySystemGroupedBackground,

  foreground:          Color.ios.label,
  text:                Color.ios.label,
  cardForeground:      Color.ios.label,
  popoverForeground:   Color.ios.label,
  accentForeground:    Color.ios.label,
  secondaryForeground: Color.ios.label,
  mutedForeground:     Color.ios.secondaryLabel,
  secondaryLabel:      Color.ios.secondaryLabel,
  tertiaryLabel:       Color.ios.tertiaryLabel,
  quaternaryLabel:     Color.ios.quaternaryLabel,
  placeholder:         Color.ios.placeholderText,
  link:                Color.ios.link,

  accent:               Color.ios.systemFill,
  input:                Color.ios.secondarySystemFill,
  systemFill:           Color.ios.systemFill,
  secondarySystemFill:  Color.ios.secondarySystemFill,
  tertiarySystemFill:   Color.ios.tertiarySystemFill,
  quaternarySystemFill: Color.ios.quaternarySystemFill,

  separator: Color.ios.separator,
  border:    Color.ios.opaqueSeparator,

  systemBlue:   Color.ios.systemBlue,
  systemRed:    Color.ios.systemRed,
  systemGreen:  Color.ios.systemGreen,
  systemOrange: Color.ios.systemOrange,
  systemYellow: Color.ios.systemYellow,
  systemMint:   Color.ios.systemMint,
  systemTeal:   Color.ios.systemTeal,
  systemCyan:   Color.ios.systemCyan,
  systemIndigo: Color.ios.systemIndigo,
  systemPurple: Color.ios.systemPurple,
  systemPink:   Color.ios.systemPink,
  systemBrown:  Color.ios.systemBrown,
  systemGray:   Color.ios.systemGray,
  systemGray2:  Color.ios.systemGray2,
  systemGray3:  Color.ios.systemGray3,
  systemGray4:  Color.ios.systemGray4,
  systemGray5:  Color.ios.systemGray5,
  systemGray6:  Color.ios.systemGray6,

  primary:     Color.ios.systemBlue,
  tint:        Color.ios.systemBlue,
  ring:        Color.ios.systemBlue,
  destructive: Color.ios.systemRed,
  success:     Color.ios.systemGreen,
  warning:     Color.ios.systemOrange,
  gold:        Color.ios.systemYellow,

  icon:            Color.ios.secondaryLabel,
  tabIconDefault:  Color.ios.secondaryLabel,
  tabIconSelected: Color.ios.systemBlue,

  primaryForeground:     '#FFFFFF' as const,
  destructiveForeground: '#FFFFFF' as const,
  successForeground:     '#FFFFFF' as const,
  warningForeground:     '#FFFFFF' as const,
  onColor:               '#FFFFFF' as const,

  surfaceTinted:         DynamicColorIOS({ light: 'rgba(0,136,255,0.08)',  dark: 'rgba(0,145,255,0.10)' }),
  primaryFill:           DynamicColorIOS({ light: 'rgba(0,136,255,0.14)',  dark: 'rgba(0,145,255,0.16)' }),
  primaryEmphasized:     DynamicColorIOS({ light: 'rgba(0,136,255,0.20)',  dark: 'rgba(0,145,255,0.22)' }),
  primaryIntensityLow:   DynamicColorIOS({ light: 'rgba(0,136,255,0.25)',  dark: 'rgba(0,145,255,0.30)' }),
  primaryIntensityMedium:DynamicColorIOS({ light: 'rgba(0,136,255,0.55)',  dark: 'rgba(0,145,255,0.60)' }),
  borderAccent:       DynamicColorIOS({ light: 'rgba(0,136,255,0.20)',  dark: 'rgba(0,145,255,0.22)' }),
  borderAccentStrong: DynamicColorIOS({ light: 'rgba(0,136,255,0.45)',  dark: 'rgba(0,145,255,0.38)' }),
  glowShadow:         DynamicColorIOS({ light: 'rgba(0,136,255,0.15)',  dark: 'rgba(0,145,255,0.22)' }),

  destructiveFill:       DynamicColorIOS({ light: 'rgba(255,59,48,0.12)',  dark: 'rgba(255,69,58,0.15)' }),
  destructiveBorder:     DynamicColorIOS({ light: 'rgba(255,59,48,0.35)',  dark: 'rgba(255,69,58,0.45)' }),
  destructiveBackground: DynamicColorIOS({ light: 'rgba(255,59,48,0.10)',  dark: 'rgba(255,69,58,0.15)' }),

  successFill:       DynamicColorIOS({ light: 'rgba(52,199,89,0.15)',   dark: 'rgba(48,209,88,0.18)' }),
  successBorder:     DynamicColorIOS({ light: 'rgba(52,199,89,0.25)',   dark: 'rgba(48,209,88,0.30)' }),
  successBackground: DynamicColorIOS({ light: 'rgba(52,199,89,0.10)',   dark: 'rgba(48,209,88,0.15)' }),

  goldFill:       DynamicColorIOS({ light: 'rgba(255,204,0,0.15)',  dark: 'rgba(255,214,10,0.18)' }),
  goldBorder:     DynamicColorIOS({ light: 'rgba(255,204,0,0.28)',  dark: 'rgba(255,214,10,0.35)' }),
  goldBackground: DynamicColorIOS({ light: 'rgba(255,204,0,0.12)',  dark: 'rgba(255,214,10,0.15)' }),

  warningBackground: DynamicColorIOS({ light: 'rgba(255,149,0,0.10)',  dark: 'rgba(255,159,10,0.15)' }),

  accentFill: DynamicColorIOS({ light: 'rgba(142,142,147,0.12)', dark: 'rgba(142,142,147,0.15)' }),

  overlay: DynamicColorIOS({ light: 'rgba(0,0,0,0.40)', dark: 'rgba(0,0,0,0.60)' }),
  shadow:  DynamicColorIOS({ light: 'rgba(0,0,0,0.05)', dark: 'rgba(0,0,0,0.30)' }),
} as const;

export type ColorPalette = typeof Colors;

export const Radius = {
  none: 0,
  sm: 6,
  md: 8,
  DEFAULT: 10,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 26,
  full: 9999,
};

// Phase base colors — single source of truth for orb, badge, gradient, mini-orb
// Character-first: coach is low-chroma calm, research/advisor are vivid
export const PhaseColors = {
  idle:     '#D9960F', // warm amber — matches brand icon
  research: '#0088FF', // vivid blue — clarity, search, intelligence
  coach:    '#A692CA', // muted lavender — low chroma, high lightness (calm)
  advisor:  '#0EA878', // deep emerald — high chroma, lower lightness (decisive)
} as const;

export const AnimationColors = {
  // OKLCH-informed: constant perceived lightness across each cycle
  // Speaking (default): amber cycle — matches brand orb
  speaking: ['#E6A220', '#EDB02C', '#E6A220', '#D8961C', '#CF8E18'] as const,
  // Research: blue cycle — vivid, intelligence, search
  research: ['#0088FF', '#0091F0', '#009AE8', '#007AEE', '#006BE0'] as const,
  // Coach: L≈0.78, C≈0.08, H≈290-300
  coach: ['#B8A4D8', '#C2B0E0', '#B8A4D8', '#AE9AD0', '#A692CA'] as const,
  // Advisor: L≈0.65, C≈0.15, H≈165-175
  advisor: ['#0EA878', '#18B884', '#0EA878', '#0A976C', '#088D64'] as const,
  search: '#F59E0B' as const,
  searchLight: '#FCD34D' as const,
  searchFill: 'rgba(245,158,11,0.12)' as const,
  searchBorder: 'rgba(245,158,11,0.25)' as const,
  // Savings glow — desaturated for OLED/LCD consistency
  savingsGlow: '#2DB550' as const,
} as const;

// Immersive overlay colors
export const Overlay = {
  dark: 'rgba(0,0,0,0.85)' as const,
  darker: 'rgba(0,0,0,0.92)' as const,
  onDark: '#FFFFFF' as const,
  onDarkSecondary: 'rgba(255,255,255,0.7)' as const,
  onDarkTertiary: 'rgba(255,255,255,0.6)' as const,
  onDarkQuaternary: 'rgba(255,255,255,0.5)' as const,
  onDarkFill: 'rgba(255,255,255,0.1)' as const,
  destructiveFill: 'rgba(255,59,48,0.3)' as const,
} as const;

// Phase-tinted gradients for ambient backgrounds
export const PhaseGradients: Record<string, [string, string, string, string]> = {
  idle:     ['transparent', 'rgba(217,150,15,0.06)', 'rgba(217,150,15,0.03)', 'transparent'],
  research: ['transparent', 'rgba(0,136,255,0.04)', 'rgba(0,136,255,0.02)', 'transparent'],
  coach:    ['transparent', 'rgba(166,146,202,0.04)', 'rgba(166,146,202,0.02)', 'transparent'],
  advisor:  ['transparent', 'rgba(14,168,120,0.07)', 'rgba(14,168,120,0.04)', 'transparent'],
} as const;

export const CardTypeColors = {
  // Card backgrounds bumped to 2x opacity for grayscale readability
  // Each type has distinct perceived lightness so cards differentiate without color vision
  price: {
    color: Colors.systemGreen,
    bg: DynamicColorIOS({ light: 'rgba(52,199,89,0.12)', dark: 'rgba(48,209,88,0.14)' }),
    border: DynamicColorIOS({ light: 'rgba(52,199,89,0.25)', dark: 'rgba(48,209,88,0.30)' }),
    label: 'Price Intel',
    icon: 'tag.fill',
  },
  warning: {
    color: Colors.systemRed,
    bg: DynamicColorIOS({ light: 'rgba(255,59,48,0.10)', dark: 'rgba(255,69,58,0.12)' }),
    border: DynamicColorIOS({ light: 'rgba(255,59,48,0.22)', dark: 'rgba(255,69,58,0.26)' }),
    label: 'Alert',
    icon: 'exclamationmark.triangle.fill',
  },
  alternative: {
    color: Colors.systemTeal,
    bg: DynamicColorIOS({ light: 'rgba(48,176,199,0.10)', dark: 'rgba(64,200,224,0.12)' }),
    border: DynamicColorIOS({ light: 'rgba(48,176,199,0.22)', dark: 'rgba(64,200,224,0.26)' }),
    label: 'Alternative',
    icon: 'arrow.triangle.branch',
  },
  leverage: {
    color: Colors.systemOrange,
    bg: DynamicColorIOS({ light: 'rgba(255,149,0,0.10)', dark: 'rgba(255,159,10,0.12)' }),
    border: DynamicColorIOS({ light: 'rgba(255,149,0,0.22)', dark: 'rgba(255,159,10,0.26)' }),
    label: 'Leverage',
    icon: 'flame.fill',
  },
} as const;

export const Typography = {
  default: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.regular },
  defaultSemiBold: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.semiBold },
  title: { fontSize: 30, lineHeight: 38, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  subtitle: { fontSize: 20, lineHeight: 26, fontFamily: FontFamily.semiBold },
  link: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.regular },
};
