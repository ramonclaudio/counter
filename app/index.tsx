import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useConvexAuth } from 'convex/react';
import { useColors } from '@/hooks/use-theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/(app)' : '/(auth)/sign-in');
  }, [isAuthenticated, isLoading]);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
