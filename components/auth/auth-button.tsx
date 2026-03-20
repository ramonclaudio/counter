import { Pressable } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { authStyles as styles } from "@/lib/auth-styles";
import { useColors } from "@/hooks/use-theme";

type AuthButtonProps = {
  label: string;
  loadingText: string;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function AuthButton({ label, loadingText, isLoading, onPress, disabled = false, variant = "primary" }: AuthButtonProps) {
  const colors = useColors();
  const isPrimary = variant === "primary";
  const isDisabled = isLoading || disabled;
  return (
    <Pressable
      style={[styles.button, { backgroundColor: isPrimary ? colors.primary : colors.secondary, opacity: isDisabled ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={isLoading ? loadingText : label}
      accessibilityState={{ disabled: isDisabled }}
    >
      <ThemedText style={styles.buttonText} color={isPrimary ? colors.primaryForeground : undefined}>
        {isLoading ? loadingText : label}
      </ThemedText>
    </Pressable>
  );
}
