import { Linking, Pressable, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

import { MaterialCard } from '@/components/ui/material-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, type ColorPalette } from '@/constants/theme';
import { FontSize, IconSize, MaxWidth, Spacing, TouchTarget, TAB_BAR_CLEARANCE } from '@/constants/layout';
import { Opacity, Size } from '@/constants/ui';
import { useColors } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

const sectionStyle = { marginTop: Spacing['2xl'], paddingHorizontal: Spacing.xl, gap: Spacing.sm };
const sectionTitleStyle = { fontSize: FontSize.md, fontWeight: '500' as const, textTransform: 'uppercase' as const, marginLeft: Spacing.xs, opacity: 0.6 };
const cardStyle = { borderRadius: Radius.lg, borderCurve: 'continuous' as const, overflow: 'hidden' as const };
const dividerStyle = { height: Size.divider, marginLeft: Size.dividerMargin };

function AboutItem({
  icon,
  label,
  value,
  onPress,
  colors,
}: {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  colors: ColorPalette;
}) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <IconSymbol name={icon} size={IconSize['2xl']} color={colors.mutedForeground} />
        <ThemedText style={{ fontSize: FontSize.xl }}>{label}</ThemedText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {value && (
          <ThemedText selectable style={{ fontSize: FontSize.xl }} color={colors.mutedForeground}>
            {value}
          </ThemedText>
        )}
        {onPress && (
          <IconSymbol
            name="chevron.right"
            size={IconSize.md}
            color={colors.mutedForeground}
          />
        )}
      </View>
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
        accessibilityHint={`Opens ${label}`}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function AboutScreen() {
  const colors = useColors();

  const appVersion =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '1.0.0';
  const buildNumber = Application.nativeBuildVersion ?? '1';

  const deviceInfo = Device.modelName
    ? `${Device.manufacturer ?? ''} ${Device.modelName}`.trim()
    : 'iOS';

  const osVersion = Device.osVersion
    ? `iOS ${Device.osVersion}`
    : 'iOS';

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/ramonclaudio');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://ramonclaudio.com/apps/counter/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://ramonclaudio.com/apps/counter/terms');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE, maxWidth: MaxWidth.content, alignSelf: 'center', width: '100%' }}
      contentInsetAdjustmentBehavior="automatic">
      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>
          App
        </ThemedText>
        <MaterialCard style={cardStyle}>
          <AboutItem
            icon="info.circle.fill"
            label="Version"
            value={`${appVersion} (${buildNumber})`}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <AboutItem
            icon="hammer.fill"
            label="Expo SDK"
            value={Constants.expoConfig?.sdkVersion ?? 'Unknown'}
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>
          Device
        </ThemedText>
        <MaterialCard style={cardStyle}>
          <AboutItem
            icon="gear"
            label="Device"
            value={deviceInfo}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <AboutItem
            icon="gearshape.fill"
            label="OS"
            value={osVersion}
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View style={sectionStyle}>
        <ThemedText style={sectionTitleStyle} color={colors.mutedForeground}>
          Links
        </ThemedText>
        <MaterialCard style={cardStyle}>
          <AboutItem
            icon="link"
            label="GitHub"
            onPress={handleOpenGitHub}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <AboutItem
            icon="doc.text.fill"
            label="Privacy Policy"
            onPress={handleOpenPrivacyPolicy}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <AboutItem
            icon="doc.plaintext.fill"
            label="Terms of Service"
            onPress={handleOpenTerms}
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View style={sectionStyle}>
        <MaterialCard style={cardStyle}>
          <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
            <ThemedText style={{ fontSize: FontSize.base }} color={colors.mutedForeground}>
              © Copyright 2026 | All rights reserved.
            </ThemedText>
          </View>
        </MaterialCard>
      </View>
    </ScrollView>
  );
}
