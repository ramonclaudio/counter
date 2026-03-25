import { View } from "react-native";
import { useColors } from "@/hooks/use-theme";
import { MiniOrb } from "@/components/counter/mini-orb";

export function LoadingScreen() {
  const colors = useColors();
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <MiniOrb isSpeaking={false} isConnected={false} isSearching={false} />
    </View>
  );
}
