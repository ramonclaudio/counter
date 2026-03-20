import { type ReactNode } from 'react';
import { Pressable, View, ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Radius } from '@/constants/theme';
import { Spacing, TouchTarget, FontSize } from '@/constants/layout';
import { Opacity } from '@/constants/ui';
import { useColors } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 400 } as const;

interface GradientButtonProps {
  onPress: () => void;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function GradientButton({
  onPress,
  label,
  icon,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  style,
  accessibilityLabel,
  accessibilityHint,
}: GradientButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
    haptics.light();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || isLoading }}
        style={[
          {
            height: TouchTarget.min,
            borderRadius: Radius.full,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            paddingHorizontal: Spacing.xl,
            opacity: disabled ? Opacity.disabled : 1,
          },
          animatedStyle,
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {icon}
          <ThemedText
            style={{ fontSize: FontSize.lg, fontWeight: '600' }}
            color={colors.accent}
          >
            {label}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
        style={[
          {
            height: TouchTarget.min,
            borderRadius: Radius.full,
            borderCurve: 'continuous' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            paddingHorizontal: Spacing.xl,
            backgroundColor: colors.surfaceTinted,
            borderWidth: 1.5,
            borderColor: colors.borderAccentStrong,
            opacity: disabled ? Opacity.disabled : 1,
            shadowColor: colors.glowShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 3,
          },
          animatedStyle,
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {icon}
          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <ThemedText
              style={{ fontSize: FontSize.lg, fontWeight: '600' }}
              color={colors.accent}
            >
              {label}
            </ThemedText>
          )}
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      style={[
        {
          height: TouchTarget.min + 4,
          borderRadius: Radius.full,
          borderCurve: 'continuous' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: Spacing.xl,
          backgroundColor: colors.primary,
          opacity: disabled ? Opacity.disabled : 1,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {icon}
        {isLoading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <ThemedText
            style={{ fontSize: FontSize.lg, fontWeight: '600', letterSpacing: 0.3 }}
            color={colors.primaryForeground}
          >
            {label}
          </ThemedText>
        )}
      </View>
    </AnimatedPressable>
  );
}
