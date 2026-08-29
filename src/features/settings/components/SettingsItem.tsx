import Feather from "@expo/vector-icons/Feather";
import { ReactNode } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "tailwind-variants";

const StyledFeather = withUniwind(Feather);

type SettingsItemProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: ReactNode;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  className?: string;
  iconColor?: string;
};

export const SettingsItem = ({
  icon,
  label,
  onPress,
  rightElement,
  isToggle,
  toggleValue,
  onToggle,
  className,
  iconColor = "accent-primary",
}: SettingsItemProps) => {
  return (
    <TouchableOpacity
      className={cn(
        "flex-row items-center py-4 px-1 border-b border-border/50",
        className
      )}
      onPress={onPress}
      disabled={!onPress && !isToggle}
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10 mr-4">
        <StyledFeather name={icon} size={20} colorClassName={iconColor} />
      </View>
      <Text className="flex-1 text-body-lg font-display-medium text-foreground">
        {label}
      </Text>
      
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: "#767577", true: "#10b981" }}
        />
      ) : (
        rightElement || (
          <StyledFeather
            name="chevron-right"
            size={20}
            colorClassName="accent-neutral-400"
          />
        )
      )}
    </TouchableOpacity>
  );
};
