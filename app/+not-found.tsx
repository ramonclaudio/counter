import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useColors } from '@/hooks/use-theme';
import { Spacing, TouchTarget } from '@/constants/layout';

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Lost?' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg, backgroundColor: colors.background }}>
        <ThemedText variant="title">This page doesn&apos;t exist.</ThemedText>
        <Link href="/" style={{ paddingVertical: Spacing.lg, minHeight: TouchTarget.min, justifyContent: 'center' }} accessibilityRole="link" accessibilityLabel="Go to home screen">
          <ThemedText variant="link" color={colors.mutedForeground}>Take me home</ThemedText>
        </Link>
      </View>
    </>
  );
}
