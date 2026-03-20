import { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { router, type ErrorBoundaryProps } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, TouchTarget } from '@/constants/layout';
import { Colors, Radius } from '@/constants/theme';

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.systemGray6,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['3xl'],
        gap: Spacing.lg,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.systemGray5,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.sm,
        }}
      >
        <IconSymbol
          name="exclamationmark.triangle"
          size={32}
          color={Colors.systemBlue}
        />
      </View>
      <Text
        style={{
          fontSize: 26,
          lineHeight: 32,
          fontWeight: '700',
          textAlign: 'center',
          color: Colors.foreground,
          letterSpacing: -0.5,
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
          color: Colors.systemGray,
          marginBottom: Spacing.md,
        }}
      >
        Don&apos;t worry — let&apos;s get you back on track.
      </Text>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: Colors.systemBlue,
          paddingHorizontal: Spacing['3xl'],
          paddingVertical: Spacing.lg,
          minHeight: TouchTarget.min,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: Radius.full,
          borderCurve: 'continuous',
          shadowColor: Colors.systemBlue,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        })}
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: Colors.primaryForeground,
            letterSpacing: 0.3,
          }}
        >
          Try Again
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/today')}
        accessibilityRole="button"
        accessibilityLabel="Go home"
        style={({ pressed }) => ({
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: Colors.systemGray,
          }}
        >
          Go Home
        </Text>
      </Pressable>
    </View>
  );
}
