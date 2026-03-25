import { useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Link, router } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { haptics } from "@/lib/haptics";
import { env } from "@/lib/env";
import { useColors } from "@/hooks/use-theme";
import { authStyles as styles } from "@/lib/auth-styles";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorBanner } from "@/components/auth/error-banner";
import { AuthButton } from "@/components/auth/auth-button";

export default function ForgotPasswordScreen() {
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    haptics.light();
    setError(null);

    if (!email.trim()) {
      haptics.error();
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${env.convexSiteUrl}/reset-password`,
      });

      if (response.error) {
        haptics.error();
        setError(response.error.message ?? "Failed to send reset email");
      } else {
        haptics.success();
        setIsSubmitted(true);
      }
    } catch {
      haptics.error();
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <ThemedText variant="title">Check your email</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            A password reset link has been sent to {email}
          </ThemedText>
          <ThemedText style={styles.hint} color={colors.mutedForeground}>
            If you don&apos;t see it, check your spam folder.
          </ThemedText>
          <AuthButton
            label="Back to Sign In"
            loadingText="Back to Sign In"
            isLoading={false}
            onPress={() => router.replace("/sign-in")}
          />
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
          <ThemedText variant="title">Forgot password?</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            Enter your email to receive a password reset link
          </ThemedText>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
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
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email"
              accessibilityHint="Enter your email address to receive a reset link"
            />
          </View>

          <AuthButton
            label="Send Reset Link"
            loadingText="Sending..."
            isLoading={isLoading}
            onPress={handleForgotPassword}
          />
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText} color={colors.mutedForeground}>
            Remember your password?{" "}
          </ThemedText>
          <Link href="/sign-in" asChild>
            <Pressable
              style={styles.linkTouchTarget}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              accessibilityHint="Go back to sign in screen"
            >
              <ThemedText style={styles.linkText}>Sign In</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
