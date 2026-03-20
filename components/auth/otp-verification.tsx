import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";

import { authClient } from "@/lib/auth-client";
import { haptics } from "@/lib/haptics";
import { useColors } from "@/hooks/use-theme";
import { authStyles as styles } from "@/lib/auth-styles";
import { Spacing, IconSize } from "@/constants/layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorBanner } from "@/components/auth/error-banner";
import { AuthButton } from "@/components/auth/auth-button";

type OtpVerificationProps = {
  email: string;
  password: string;
  onBack: () => void;
};

export function OtpVerification({ email, password, onBack }: OtpVerificationProps) {
  const colors = useColors();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOtp = async () => {
    haptics.light();
    setOtpError(null);

    if (otp.length !== 6) {
      haptics.error();
      setOtpError("Please enter the 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await authClient.emailOtp.verifyEmail({
        email: email.trim(),
        otp,
      });

      if (response.error) {
        haptics.error();
        setOtpError("Invalid or expired code. Please try again.");
        return;
      }

      const signInResponse = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signInResponse.error) {
        haptics.error();
        setOtpError("Email verified but sign-in failed. Please go back and sign in manually.");
      } else {
        haptics.success();
      }
    } catch {
      haptics.error();
      setOtpError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    haptics.light();
    setIsLoading(true);
    setOtpError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "email-verification" });
      haptics.success();
    } catch {
      haptics.error();
      setOtpError("Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, styles.successContent, { backgroundColor: colors.background }]}
    >
      <View style={{ alignItems: "center", gap: Spacing.lg }}>
        <IconSymbol name="envelope.badge" size={IconSize["6xl"]} color={colors.primary} />
        <ThemedText variant="title" style={{ textAlign: "center" }}>
          Verify your email
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { textAlign: "center" }]}
          color={colors.mutedForeground}
        >
          Enter the 6-digit code sent to{"\n"}
          <ThemedText style={{ fontWeight: "600" }}>{email}</ThemedText>
        </ThemedText>
      </View>

      <ErrorBanner message={otpError} />

      <View style={{ gap: Spacing.md, marginTop: Spacing["3xl"] }}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.secondary,
              color: colors.foreground,
              borderColor: colors.border,
              textAlign: "center",
              fontSize: 24,
              letterSpacing: 8,
              fontVariant: ["tabular-nums"],
            },
          ]}
          placeholder="000000"
          placeholderTextColor={colors.mutedForeground}
          value={otp}
          onChangeText={(text) => {
            setOtp(text.replace(/\D/g, "").slice(0, 6));
            setOtpError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          accessibilityLabel="Verification code"
          accessibilityHint="Enter the 6-digit code from your email"
        />

        <AuthButton
          label="Verify"
          loadingText="Verifying..."
          isLoading={isVerifying}
          disabled={otp.length !== 6}
          onPress={handleVerifyOtp}
        />

        <AuthButton
          label="Resend Code"
          loadingText="Sending..."
          isLoading={isLoading}
          onPress={handleResendCode}
          variant="secondary"
        />

        <View style={styles.footer}>
          <ThemedText style={styles.footerText} color={colors.mutedForeground}>
            Wrong email?{" "}
          </ThemedText>
          <Pressable
            style={styles.linkTouchTarget}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Return to sign up form to correct your email"
          >
            <ThemedText style={styles.linkText}>Go back</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
