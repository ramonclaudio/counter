import { type TextStyle, type ViewStyle } from 'react-native';

import { type ColorPalette, Radius } from '@/constants/theme';
import { FontFamily, FontSize, LineHeight, MaxWidth, Spacing, TouchTarget } from '@/constants/layout';

export function getErrorStyles(colors: ColorPalette): { container: ViewStyle; text: TextStyle } {
  return {
    container: {
      backgroundColor: colors.destructiveBackground,
      borderWidth: 1,
      borderColor: colors.destructive,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    text: { color: colors.destructive, fontSize: FontSize.base, lineHeight: LineHeight.base, textAlign: 'center', fontFamily: FontFamily.regular },
  };
}

export const authStyles = {
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' as const, padding: Spacing['2xl'], alignSelf: 'center' as const, width: '100%' as const, maxWidth: MaxWidth.form },
  successContent: { flex: 1, justifyContent: 'center' as const, padding: Spacing['2xl'], gap: Spacing.lg, alignSelf: 'center' as const, width: '100%' as const, maxWidth: MaxWidth.form },
  header: { marginBottom: Spacing['3xl'], gap: Spacing.sm },
  subtitle: { fontSize: FontSize.xl, lineHeight: LineHeight.loose, fontFamily: FontFamily.regular },
  hint: { fontSize: FontSize.base, lineHeight: LineHeight.base, marginTop: Spacing.sm, fontFamily: FontFamily.regular },
  form: { gap: Spacing.lg },
  inputContainer: { gap: Spacing.sm },
  label: { fontSize: FontSize.base, fontFamily: FontFamily.medium, lineHeight: LineHeight.base },
  passwordHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  forgotText: { fontSize: FontSize.base, fontFamily: FontFamily.medium },
  input: { height: TouchTarget.min, borderRadius: Radius.md, borderCurve: 'continuous' as const, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.xl, fontFamily: FontFamily.regular },
  button: { height: TouchTarget.min, borderRadius: Radius.full, borderCurve: 'continuous' as const, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: Spacing.sm },
  buttonText: { fontSize: FontSize.base, fontFamily: FontFamily.medium },
  footer: { flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const, marginTop: Spacing['2xl'], minHeight: TouchTarget.min },
  footerText: { fontSize: FontSize.base, lineHeight: LineHeight.base, fontFamily: FontFamily.regular },
  linkText: { fontSize: FontSize.base, fontFamily: FontFamily.medium },
  linkTouchTarget: { minHeight: TouchTarget.min, justifyContent: 'center' as const, paddingHorizontal: Spacing.xs },
};
