import { useState } from "react";
import { View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";

import { ThemedText } from "@/components/ui/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AvatarSection } from "@/components/profile/avatar-section";
import { BannerSection } from "@/components/profile/banner-section";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { useColors } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { router } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Radius, Scrim } from "@/constants/theme";
import {
  Spacing,
  FontSize,
  IconSize,
  MaxWidth,
  TAB_BAR_CLEARANCE,
} from "@/constants/layout";
import { Opacity } from "@/constants/ui";

export default function DashboardScreen() {
  const colors = useColors();
  const user = useQuery(api.auth.getCurrentUser);

  const [showEditProfile, setShowEditProfile] = useState(false);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = user.displayName || user.name || "Your Name";
  const username = user.username ? `@${user.username}` : "";
  const bio = user.bio || "";
  const avatarInitial =
    (user.displayName ?? user.name)?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_CLEARANCE,
          maxWidth: MaxWidth.content,
          alignSelf: "center",
          width: "100%",
        }}
      >
        <View>
          <BannerSection
            bannerUrl={user.bannerUrl}
            isUploading={false}
            colors={colors}
            editable={false}
          />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <SafeAreaView edges={["top"]} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs }}>
              <Pressable
                onPress={() => { haptics.light(); router.back(); }}
                style={({ pressed }) => ({
                  opacity: pressed ? Opacity.pressed : 1,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Scrim.light,
                  alignItems: "center",
                  justifyContent: "center",
                })}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <IconSymbol name="chevron.left" size={IconSize.md} color={colors.onColor} />
              </Pressable>
              <Pressable
                onPress={() => { haptics.light(); router.push("/(app)/settings/preferences"); }}
                style={({ pressed }) => ({
                  opacity: pressed ? Opacity.pressed : 1,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Scrim.light,
                  alignItems: "center",
                  justifyContent: "center",
                })}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <IconSymbol name="gearshape.fill" size={IconSize.md} color={colors.onColor} />
              </Pressable>
            </SafeAreaView>
          </View>
        </View>

        <AvatarSection
          image={user.image}
          avatarInitial={avatarInitial}
          isUploading={false}
          colors={colors}
          editable={false}
          overlapsHeader
        />

        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
          <ThemedText style={{ fontSize: FontSize["5xl"], fontWeight: "700" }} numberOfLines={1}>
            {displayName}
          </ThemedText>
        </View>

        {username ? (
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxs }}>
            <ThemedText style={{ fontSize: FontSize.lg }} color={colors.mutedForeground}>
              {username}
            </ThemedText>
          </View>
        ) : null}

        {bio ? (
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm }}>
            <ThemedText
              style={{ fontSize: FontSize.base, lineHeight: 20 }}
              numberOfLines={3}
            >
              {bio}
            </ThemedText>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.sm }}>
          <Pressable
            onPress={() => { haptics.light(); setShowEditProfile(true); }}
            style={({ pressed }) => ({
              opacity: pressed ? Opacity.pressed : 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: Spacing.xs,
              paddingVertical: Spacing.md,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              backgroundColor: colors.primary,
            })}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.primaryForeground}>
              Edit Profile
            </ThemedText>
          </Pressable>

          {user.isPublic && (
            <Pressable
              onPress={() => { haptics.light(); router.push(`/(app)/user-profile/${user._id}`); }}
              style={({ pressed }) => ({
                opacity: pressed ? Opacity.pressed : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: Spacing.xs,
                paddingVertical: Spacing.md,
                borderRadius: Radius.lg,
                borderCurve: "continuous",
                backgroundColor: colors.secondary,
              })}
              accessibilityRole="button"
              accessibilityLabel="View public profile"
            >
              <IconSymbol name="eye.fill" size={IconSize.md} color={colors.mutedForeground} />
              <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.mutedForeground}>
                View Public Profile
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={() => { haptics.light(); router.push("/(app)/(tabs)/boards?segment=1"); }}
            style={({ pressed }) => ({
              opacity: pressed ? Opacity.pressed : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.md,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            })}
            accessibilityRole="button"
            accessibilityLabel="My boards"
          >
            <IconSymbol name="square.grid.2x2.fill" size={IconSize.xl} color={colors.mutedForeground} />
            <ThemedText style={{ fontSize: FontSize.base, fontWeight: "600" }} color={colors.foreground}>
              My Boards
            </ThemedText>
            <IconSymbol name="chevron.right" size={IconSize.sm} color={colors.mutedForeground} style={{ marginLeft: "auto" } as never} />
          </Pressable>
        </View>

      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        colors={colors}
      />
    </View>
  );
}
