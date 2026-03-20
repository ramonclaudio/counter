import { Alert, Linking, Pressable, ScrollView, View } from "react-native";

import { MaterialCard } from "@/components/ui/material-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { Radius, type ColorPalette } from "@/constants/theme";
import {
  FontSize,
  IconSize,
  LineHeight,
  MaxWidth,
  Spacing,
  TouchTarget,
  TAB_BAR_CLEARANCE,
} from "@/constants/layout";
import { Opacity, Size } from "@/constants/ui";
import { useColors } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";

const dividerStyle = { height: Size.divider, marginLeft: Size.dividerMargin };
const faqItemStyle = { padding: Spacing.lg, gap: Spacing.xs };
const faqQuestionStyle = { fontSize: FontSize.xl, fontWeight: "500" as const };
const faqAnswerStyle = { fontSize: FontSize.base, lineHeight: LineHeight.base };

function HelpItem({
  icon,
  label,
  description,
  onPress,
  colors,
}: {
  icon: Parameters<typeof IconSymbol>[0]["name"];
  label: string;
  description: string;
  onPress?: () => void;
  colors: ColorPalette;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: Spacing.lg,
          minHeight: TouchTarget.min,
        },
        { opacity: pressed ? Opacity.pressed : 1 },
      ]}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.md,
          flex: 1,
        }}
      >
        <IconSymbol
          name={icon}
          size={IconSize["2xl"]}
          color={colors.mutedForeground}
        />
        <View style={{ flex: 1, gap: Spacing.xs / 2 }}>
          <ThemedText style={{ fontSize: FontSize.xl }}>{label}</ThemedText>
          <ThemedText
            style={{ fontSize: FontSize.md }}
            color={colors.mutedForeground}
          >
            {description}
          </ThemedText>
        </View>
      </View>
      <IconSymbol
        name="arrow.up.right"
        size={IconSize.md}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

function FAQItem({
  question,
  answer,
  colors,
}: {
  question: string;
  answer: string;
  colors: ColorPalette;
}) {
  return (
    <View style={faqItemStyle}>
      <ThemedText style={faqQuestionStyle}>{question}</ThemedText>
      <ThemedText style={faqAnswerStyle} color={colors.mutedForeground}>
        {answer}
      </ThemedText>
    </View>
  );
}

export default function HelpScreen() {
  const colors = useColors();

  const handleOpenGitHub = () => {
    Linking.openURL("https://github.com/ramonclaudio/counter/issues");
  };

  const handleOpenEmail = async () => {
    const url = "mailto:hello@ramonclaudio.com?subject=App Support";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "No Email App",
        "Please configure an email app or contact hello@ramonclaudio.com",
      );
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CLEARANCE,
        maxWidth: MaxWidth.content,
        alignSelf: "center",
        width: "100%",
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View
        style={{
          marginTop: Spacing["2xl"],
          paddingHorizontal: Spacing.xl,
          gap: Spacing.sm,
        }}
      >
        <ThemedText
          style={{
            fontSize: FontSize.md,
            fontWeight: "500",
            textTransform: "uppercase",
            marginLeft: Spacing.xs,
            opacity: 0.6,
          }}
          color={colors.mutedForeground}
        >
          Contact
        </ThemedText>
        <MaterialCard
          style={{
            borderRadius: Radius.lg,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          <HelpItem
            icon="envelope.fill"
            label="Email Support"
            description="Get help via email"
            onPress={handleOpenEmail}
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <HelpItem
            icon="exclamationmark.bubble.fill"
            label="Report an Issue"
            description="Open a GitHub issue"
            onPress={handleOpenGitHub}
            colors={colors}
          />
        </MaterialCard>
      </View>

      <View
        style={{
          marginTop: Spacing["2xl"],
          paddingHorizontal: Spacing.xl,
          gap: Spacing.sm,
        }}
      >
        <ThemedText
          style={{
            fontSize: FontSize.md,
            fontWeight: "500",
            textTransform: "uppercase",
            marginLeft: Spacing.xs,
            opacity: 0.6,
          }}
          color={colors.mutedForeground}
        >
          FAQ
        </ThemedText>
        <MaterialCard
          style={{
            borderRadius: Radius.lg,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          <FAQItem
            question="How do I delete my account?"
            answer="Go to Settings → Delete Account. This will permanently remove all your data."
            colors={colors}
          />
          <View style={[dividerStyle, { backgroundColor: colors.border }]} />
          <FAQItem
            question="Why aren't notifications working?"
            answer="Make sure notifications are enabled in Settings → Notifications. You must use a physical device."
            colors={colors}
          />
        </MaterialCard>
      </View>
    </ScrollView>
  );
}
