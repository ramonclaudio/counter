import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/hooks/use-network';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing, FontSize } from '@/constants/layout';
import { ZIndex } from '@/constants/ui';
import { useColors } from '@/hooks/use-theme';

export function OfflineBanner() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  if (!isOffline) return null;

  return (
    <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: ZIndex.offlineBanner, backgroundColor: colors.destructive, paddingTop: insets.top }}>
      <View style={{ paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, alignItems: 'center' }}>
        <ThemedText style={{ fontSize: FontSize.md, fontWeight: '600' }} color={colors.destructiveForeground}>You&apos;re offline</ThemedText>
      </View>
    </View>
  );
}
