import { useState, useEffect, useRef } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { getLevelFromXp } from '@/constants/goals';
import { useColors } from '@/hooks/use-theme';
import { HeaderTint } from '@/constants/theme';
import { LevelUpModal } from '@/components/engagement';
import { TimerProvider } from '@/hooks/use-create-timer';
import { userTimezone } from '@/lib/timezone';

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: '(tabs)',
};

export { AppErrorBoundary as ErrorBoundary } from '@/components/ui/error-boundary';

type LevelUpState = {
  showModal: boolean;
  level: number;
  levelTitle: string;
};

export default function AppLayout() {
  const colors = useColors();
  const segments = useSegments();
  const onboardingStatus = useQuery(api.userPreferences.getOnboardingStatus);
  const user = useQuery(api.auth.getCurrentUser);

  const progress = useQuery(api.progress.getProgress, { timezone: userTimezone });
  const previousLevelRef = useRef<number | null>(null);
  const [levelUpState, setLevelUpState] = useState<LevelUpState>({
    showModal: false,
    level: 0,
    levelTitle: '',
  });

  useEffect(() => {
    if (!progress) return;
    const currentLevel = getLevelFromXp(progress.totalXp);
    if (previousLevelRef.current === null) {
      previousLevelRef.current = currentLevel.level;
      return;
    }
    if (currentLevel.level > previousLevelRef.current) {
      setLevelUpState({ showModal: true, level: currentLevel.level, levelTitle: currentLevel.title });
      previousLevelRef.current = currentLevel.level;
    }
  }, [progress]);

  const dismissLevelUpModal = () => setLevelUpState((prev) => ({ ...prev, showModal: false }));

  const isOnboardingRoute = segments.some((s) => s === 'onboarding');

  if (onboardingStatus === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (onboardingStatus && !onboardingStatus.completed && !isOnboardingRoute) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return (
    <TimerProvider>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: 'Back',
          headerTintColor: HeaderTint as string,
          headerBackground: () => <View style={{ flex: 1, backgroundColor: colors.background }} />,
          headerShadowVisible: false,
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="subscribe" options={{ presentation: 'modal', title: 'Upgrade to Premium', headerShown: true, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="goal/[id]" options={{ headerShown: true, headerBackTitle: 'Back', title: '' }} />
        <Stack.Screen name="user-profile/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>

      <LevelUpModal
        visible={levelUpState.showModal}
        level={levelUpState.level}
        levelTitle={levelUpState.levelTitle}
        onDismiss={dismissLevelUpModal}
      />
    </View>
    </TimerProvider>
  );
}
