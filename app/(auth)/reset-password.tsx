import { useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Link, router, useLocalSearchParams } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { haptics } from "@/lib/haptics";
import { useColors } from "@/hooks/use-theme";
import { authStyles as styles } from "@/lib/auth-styles";
import { Spacing } from "@/constants/layout";
import { ThemedText } from "@/components/ui/themed-text";
import { validatePassword } from "@/convex/validation";
import { ErrorBanner } from "@/components/auth/error-banner";
import { AuthButton } from "@/components/auth/auth-button";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    haptics.light();
    setError(null);

    if (!token) {
      haptics.error();
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    if (!password || !confirmPassword) {
      haptics.error();
      setError("Please fill in all fields");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      haptics.error();
      setError(passwordCheck.error!);
      return;
    }

    if (password !== confirmPassword) {
      haptics.error();
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (response.error) {
        haptics.error();
        const message = response.error.message ?? "Failed to reset password";
        if (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid")
        ) {
          setError("This reset link has expired. Please request a new one.");
        } else {
          setError(message);
        }
      } else {
        haptics.success();
        setIsSuccess(true);
      }
    } catch {
      haptics.error();
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <ThemedText variant="title">Password reset!</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            Your password has been successfully reset. You can now sign in with your new password.
          </ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/sign-in")}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <ThemedText style={styles.buttonText} color={colors.primaryForeground}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <ThemedText variant="title">Reset password</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            Enter your new password below
          </ThemedText>
        </View>

        <ErrorBanner message={error}>
          {error && (error.includes("expired") || error.includes("Invalid reset link")) && (
            <Link href="/forgot-password" asChild>
              <Pressable
                style={[styles.linkTouchTarget, { alignSelf: "center", marginTop: Spacing.sm }]}
                accessibilityRole="link"
                accessibilityLabel="Request a new link"
                accessibilityHint="Navigate to forgot password to request a new reset link"
              >
                <ThemedText style={styles.linkText}>Request a new link</ThemedText>
              </Pressable>
            </Link>
          )}
        </ErrorBanner>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>New Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: error ? colors.destructive : colors.border,
                },
                isLoading && { opacity: 0.5 },
              ]}
              placeholder="At least 10 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              editable={!isLoading}
              secureTextEntry
              autoComplete="password-new"
              accessibilityLabel="New password"
              accessibilityHint="Create a new password with at least 10 characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: error ? colors.destructive : colors.border,
                },
                isLoading && { opacity: 0.5 },
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              editable={!isLoading}
              secureTextEntry
              autoComplete="password-new"
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your new password to confirm"
            />
          </View>

          <AuthButton
            label="Reset Password"
            loadingText="Resetting..."
            isLoading={isLoading}
            onPress={handleResetPassword}
          />
        </View>

        <View style={styles.footer}>
          <Link href="/sign-in" asChild>
            <Pressable
              style={styles.linkTouchTarget}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
              accessibilityHint="Navigate back to sign in screen"
            >
              <ThemedText style={styles.linkText} color={colors.mutedForeground}>
                Back to Sign In
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
