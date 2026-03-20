import { SymbolView, type SymbolWeight, type SFSymbol } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type ViewStyle } from "react-native";

import { IconSize } from "@/constants/layout";

export type IconSymbolName = string;

type IconSymbolProps = {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
};

export function IconSymbol({
  name,
  size = IconSize["3xl"],
  color,
  style,
  weight = "regular",
}: IconSymbolProps) {
  return (
    <SymbolView
      name={name as SFSymbol}
      size={size}
      tintColor={color as string}
      style={style}
      weight={weight}
      resizeMode="scaleAspectFit"
    />
  );
}
