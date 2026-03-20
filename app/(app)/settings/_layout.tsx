import { View } from 'react-native';
import { Stack } from 'expo-router';

import { useColors } from '@/hooks/use-theme';
import { HeaderTint } from '@/constants/theme';

export default function DashboardLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackground: () => <View style={{ flex: 1, backgroundColor: colors.background }} />,
        headerTintColor: HeaderTint as string,
        headerTitleStyle: { color: HeaderTint as string },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="preferences" options={{ title: 'Settings', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="help" options={{ title: 'Help', headerBackTitle: 'Settings' }} />
      <Stack.Screen name="blocked-users" options={{ title: 'Blocked Users', headerBackTitle: 'Settings' }} />
    </Stack>
  );
}
