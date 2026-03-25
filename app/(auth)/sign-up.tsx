import { useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Link } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { haptics } from "@/lib/haptics";
import { useColors } from "@/hooks/use-theme";
import { authStyles as styles } from "@/lib/auth-styles";
import { ThemedText } from "@/components/ui/themed-text";
import { OtpVerification } from "@/components/auth/otp-verification";
import { validatePassword, validateUsername } from "@/convex/validation";
import { ErrorBanner } from "@/components/auth/error-banner";
import { AuthButton } from "@/components/auth/auth-button";

export default function SignUpScreen() {
  const colors = useColors();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleSignUp = async () => {
    haptics.light();
    setError(null);

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      haptics.error();
      setError("Please fill in all fields");
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const usernameCheck = validateUsername(trimmedUsername);
    if (!usernameCheck.valid) {
      haptics.error();
      setError(usernameCheck.error!);
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      haptics.error();
      setError(passwordCheck.error!);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
        username: trimmedUsername,
      });

      if (response.error) {
        haptics.error();
        setError("Unable to create account. Please try a different email or username.");
      } else {
        haptics.success();
        // Explicitly send OTP after sign-up
        await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "email-verification" }).catch(() => {});
        setShowVerification(true);
      }
    } catch {
      haptics.error();
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <OtpVerification
        email={email}
        password={password}
        onBack={() => setShowVerification(false)}
      />
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
          <ThemedText variant="title">Create account</ThemedText>
          <ThemedText style={styles.subtitle} color={colors.mutedForeground}>
            Start finding better deals
          </ThemedText>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
                isLoading && { opacity: 0.5 },
              ]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              editable={!isLoading}
              autoComplete="name"
              accessibilityLabel="Name"
              accessibilityHint="Enter your full name"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
                isLoading && { opacity: 0.5 },
              ]}
              placeholder="3-20 characters"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(null);
              }}
              editable={!isLoading}
              autoCapitalize="none"
              autoComplete="username-new"
              autoCorrect={false}
              accessibilityLabel="Username"
              accessibilityHint="Choose a username between 3 and 20 characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
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
              accessibilityHint="Enter your email address"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderColor: colors.border,
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
              accessibilityLabel="Password"
              accessibilityHint="Create a password with at least 10 characters"
            />
          </View>

          <AuthButton
            label="Sign Up"
            loadingText="Creating account..."
            isLoading={isLoading}
            onPress={handleSignUp}
          />
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText} color={colors.mutedForeground}>
            Already have an account?{" "}
          </ThemedText>
          <Link href="/sign-in" asChild>
            <Pressable
              style={styles.linkTouchTarget}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              accessibilityHint="Go to sign in screen"
            >
              <ThemedText style={styles.linkText}>Sign In</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
