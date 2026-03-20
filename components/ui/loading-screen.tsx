import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-theme";

export function LoadingScreen() {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
