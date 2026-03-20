import { Color } from 'expo-router';
import { DynamicColorIOS } from 'react-native';

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

export const Typography = {
  default: { fontSize: 16, lineHeight: 24 },
  defaultSemiBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.5 },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  link: { fontSize: 16, lineHeight: 24 },
};
