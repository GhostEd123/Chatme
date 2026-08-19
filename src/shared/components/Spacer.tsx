// @/shared/components/Spacer.tsx
import { View } from "react-native";

type SpacerProps = {
  size: number;
  horizontal?: boolean;
};

const Spacer = ({ size, horizontal = false }: SpacerProps) => {
  return <View style={horizontal ? { width: size } : { height: size }} />;
};

export default Spacer;
