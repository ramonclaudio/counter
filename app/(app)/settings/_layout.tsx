import { Stack } from 'expo-router';

import { useColors } from '@/hooks/use-theme';
import { HeaderTint } from '@/constants/theme';

export default function DashboardLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background as string },
        headerTintColor: HeaderTint as string,
        headerTitleStyle: { color: HeaderTint as string },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="privacy" options={{ title: 'Privacy', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="help" options={{ title: 'Help', headerBackTitle: 'Settings' }} />
    </Stack>
  );
}
