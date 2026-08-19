import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";
import { ToastConfig } from "react-native-toast-message";
import { withUniwind } from "uniwind";

// Wrap the icons so they can accept className for styling
const UniAntDesign = withUniwind(AntDesign);
const UniFontAwesome5 = withUniwind(FontAwesome5);
const UniIonicons = withUniwind(Ionicons);
const UniMaterialIcons = withUniwind(MaterialIcons);

const TOAST_STATE = {
  success: {
    // Light mode uses global.css | Dark mode uses your custom HSLs
    container:
      "bg-primary-50 border-primary-200 dark:bg-[hsl(150,100%,6%)] dark:border-[hsl(147,100%,12%)]",
    textClass: "text-primary-600 dark:text-[hsl(150,86%,65%)]",
    iconClass: "text-primary-600 dark:text-[hsl(150,86%,65%)]",
  },
  error: {
    container:
      "bg-red-50 border-red-200 dark:bg-[hsl(358,76%,10%)] dark:border-[hsl(357,89%,16%)]",
    textClass: "text-red-400 dark:text-[hsl(358,100%,81%)]",
    iconClass: "text-red-400 dark:text-[hsl(358,100%,81%)]",
  },
  warning: {
    container:
      "bg-orange-50 border-orange-200 dark:bg-[hsl(64,100%,6%)] dark:border-[hsl(60,100%,12%)]",
    textClass: "text-orange-400 dark:text-[hsl(46,100%,68%)]",
    iconClass: "text-orange-400 dark:text-[hsl(46,100%,68%)]",
  },
  info: {
    container:
      "bg-blue-50 border-blue-200 dark:bg-[hsl(215,100%,6%)] dark:border-[hsl(223,100%,12%)]",
    textClass: "text-blue-400 dark:text-[hsl(210,100%,66%)]",
    iconClass: "text-blue-400 dark:text-[hsl(210,100%,66%)]",
  },
};

type SonnerToastProps = {
  text1?: string;
  text2?: string;
};

function SonnerToast({
  text1,
  text2,
  icon,
  state,
}: SonnerToastProps & {
  icon: React.ReactNode;
  state: keyof typeof TOAST_STATE;
}) {
  const { container, textClass } = TOAST_STATE[state];

  return (
    <View
      className={`w-[90%] min-h-[56px] rounded-[10px] border flex-row items-center px-4 py-3 gap-2.5 ${container}`}
    >
      <View className="w-6 items-center justify-center shrink-0">{icon}</View>

      <View className="flex-1 gap-0.5">
        {text1 && (
          <Text className="text-body-md font-display-semibold text-foreground">
            {text1}
          </Text>
        )}
        {text2 && (
          <Text className={`text-body-sm opacity-90 ${textClass}`}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <SonnerToast
      text1={text1}
      text2={text2}
      state="success"
      icon={
        <UniFontAwesome5
          name="check-circle"
          size={18}
          className={TOAST_STATE.success.iconClass}
        />
      }
    />
  ),

  error: ({ text1, text2 }) => (
    <SonnerToast
      text1={text1}
      text2={text2}
      state="error"
      icon={
        <UniMaterialIcons
          name="error-outline"
          size={20}
          className={TOAST_STATE.error.iconClass}
        />
      }
    />
  ),

  warning: ({ text1, text2 }) => (
    <SonnerToast
      text1={text1}
      text2={text2}
      state="warning"
      icon={
        <UniIonicons
          name="warning-outline"
          size={20}
          className={TOAST_STATE.warning.iconClass}
        />
      }
    />
  ),

  info: ({ text1, text2 }) => (
    <SonnerToast
      text1={text1}
      text2={text2}
      state="info"
      icon={
        <UniAntDesign
          name="info-circle"
          size={18}
          className={TOAST_STATE.info.iconClass}
        />
      }
    />
  ),

  customAction: ({ text1, text2 }) => (
    <View className="h-[60px] w-[90%] bg-surface rounded-xl p-4 justify-center shadow-lg shadow-black/10 dark:shadow-black/50 elevation-5">
      <Text className="text-foreground font-display-bold text-body-lg">
        {text1}
      </Text>
      {text2 && <Text className="text-muted text-body-sm mt-0.5">{text2}</Text>}
    </View>
  ),
};
