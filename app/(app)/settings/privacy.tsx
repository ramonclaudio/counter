import { Linking, Pressable, ScrollView, View } from 'react-native';

import { MaterialCard } from '@/components/ui/material-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, type ColorPalette } from '@/constants/theme';
import { FontFamily, FontSize, IconSize, LineHeight, MaxWidth, Spacing, TouchTarget, TAB_BAR_CLEARANCE } from '@/constants/layout';
import { Opacity, Size } from '@/constants/ui';
import { useColors } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

const dividerStyle = { height: Size.divider, marginLeft: Size.dividerMargin };
const sectionStyle = { marginTop: Spacing['2xl'], paddingHorizontal: Spacing.xl, gap: Spacing.sm };
const sectionTitleStyle = { fontSize: FontSize.md, fontFamily: FontFamily.medium, textTransform: 'uppercase' as const, marginLeft: Spacing.xs, opacity: 0.6 };
const cardStyle = { borderRadius: Radius.lg, borderCurve: 'continuous' as const, overflow: 'hidden' as const };

function PrivacyItem({ icon, label, description, onPress, colors }: {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  description: string;
  onPress?: () => void;
  colors: ColorPalette;
}) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
        <IconSymbol name={icon} size={IconSize['2xl']} color={colors.mutedForeground} />
        <View style={{ flex: 1, gap: Spacing.xs / 2 }}>
          <ThemedText style={{ fontSize: FontSize.xl, fontFamily: FontFamily.regular }}>{label}</ThemedText>
          <ThemedText style={{ fontSize: FontSize.md, fontFamily: FontFamily.regular }} color={colors.mutedForeground}>{description}</ThemedText>
        </View>
      </View>
      {onPress && <IconSymbol name="chevron.right" size={IconSize.md} color={colors.mutedForeground} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => ({ opacity: pressed ? Opacity.pressed : 1, minHeight: TouchTarget.min })}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={description}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function PrivacyScreen() {
  const colors = useColors();

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE, maxWidth: MaxWidth.content, alignSelf: 'center', width: '100%' }}
      contentInsetAdjustmentBehavior="automatic">
      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>Device Permissions</ThemedText>
        <MaterialCard style={cardStyle}>
          <PrivacyItem
            icon="camera.fill"
            label="Camera & Photos"
            description="Used for profile avatar"
            onPress={handleOpenSettings}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <PrivacyItem
            icon="bell.fill"
            label="Notifications"
            description="Push notification access"
            onPress={handleOpenSettings}
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>Data Collection</ThemedText>
        <MaterialCard style={cardStyle}>
          <PrivacyItem
            icon="person.fill"
            label="Account Data"
            description="Name, email, and profile information"
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <PrivacyItem
            icon="checklist"
            label="Action Data"
            description="Your actions and completion history"
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>Your Rights</ThemedText>
        <MaterialCard style={cardStyle}>
          <View style={{ padding: Spacing.lg }}>
            <ThemedText style={{ fontSize: FontSize.base, fontFamily: FontFamily.regular, lineHeight: LineHeight.base }} color={colors.mutedForeground}>
              You can request a copy of your data or delete your account at any time from Settings → Delete Account.
              {'\n\n'}
              Your personal information is never sold to third parties.
            </ThemedText>
          </View>
        </MaterialCard>
      </View>
    </ScrollView>
  );
}
