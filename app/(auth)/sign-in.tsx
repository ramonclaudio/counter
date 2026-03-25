import { useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Link } from "expo-router";

import { authClient, signInWithUsername } from "@/lib/auth-client";
import { haptics } from "@/lib/haptics";
import { useColors } from "@/hooks/use-theme";
import { authStyles as styles } from "@/lib/auth-styles";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorBanner } from "@/components/auth/error-banner";
import { AuthButton } from "@/components/auth/auth-button";

export default function SignInScreen() {
  const colors = useColors();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    haptics.light();
    setError(null);

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      haptics.error();
      setError("Please enter email/username and password");
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = trimmed.includes("@");
      const response = isEmail
        ? await authClient.signIn.email({ email: trimmed, password })
        : await signInWithUsername({ username: trimmed.toLowerCase(), password });

      if (response.error) {
        haptics.error();
        setError("Invalid email/username or password");
      } else {
        haptics.success();
      }
    } catch {
      haptics.error();
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <ThemedText variant="title">Welcome back to Counter</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            Sign in to your account
          </ThemedText>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email or Username</ThemedText>
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
              placeholder="you@example.com or username"
              placeholderTextColor={colors.mutedForeground}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setError(null);
              }}
              editable={!isLoading}
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              accessibilityLabel="Email or username"
              accessibilityHint="Enter your email address or username"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordHeader}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <Link href="/forgot-password" asChild>
                <Pressable
                  style={styles.linkTouchTarget}
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                  accessibilityHint="Navigate to password reset"
                >
                  <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
                </Pressable>
              </Link>
            </View>
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
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              editable={!isLoading}
              secureTextEntry
              autoComplete="password"
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
          </View>

          <AuthButton
            label="Sign In"
            loadingText="Signing in..."
            isLoading={isLoading}
            onPress={handleSignIn}
          />

        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText} color={colors.mutedForeground}>
            Don&apos;t have an account?{" "}
          </ThemedText>
          <Link href="/sign-up" asChild>
            <Pressable
              style={styles.linkTouchTarget}
              accessibilityRole="link"
              accessibilityLabel="Sign up"
              accessibilityHint="Go to create account screen"
            >
              <ThemedText style={styles.linkText}>Sign Up</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
