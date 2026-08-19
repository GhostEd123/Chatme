// @/shared/components/AuthTemplate.tsx
import ChatLayoutWrapper from "@/shared/components/ChatLayoutWrapper";
import Spacer from "@/shared/components/Spacer";
import OThemedButton from "@/shared/components/ThemedButton";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ComponentProps, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInLeft } from "react-native-reanimated";
import { withUniwind } from "uniwind";

const StyledFeather = withUniwind(Feather);
const ThemedButton = Animated.createAnimatedComponent(OThemedButton);

type AuthTemplateProps = {
  title: ReactNode;
  description?: ReactNode;
  goBack?: boolean;
  onBack?: () => void;
  children?: ReactNode;
  buttonProps?: Omit<ComponentProps<typeof OThemedButton>, "label">;
  bottomWidget?: ReactNode;
};

const AuthTemplate = ({
  title,
  description,
  goBack = false,
  onBack,
  children,
  buttonProps,
  bottomWidget,
}: AuthTemplateProps) => {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <ChatLayoutWrapper
      bottomWidget={bottomWidget}
      bottomInput={
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200).springify()} 
          className="px-safe-offset-6 pb-4"
        >
          <ThemedButton label="Next" variant="primary" {...buttonProps} />
        </Animated.View>
      }
    >
      <View className="p-safe-offset-6 flex-1">
        {goBack ? (
          <Animated.View entering={FadeInLeft.duration(400).springify()}>
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={12}
              activeOpacity={0.7}
              className="size-11 rounded-2xl border-[1.5px] border-border flex items-center justify-center bg-surface/50 mb-6"
            >
              <StyledFeather
                name="chevron-left"
                size={24}
                colorClassName="accent-neutral-900 dark:accent-white/90"
              />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Spacer size={40} />
        )}

        <Animated.View 
          entering={FadeInDown.duration(500).springify()} 
          className="max-w-96 mb-8"
        >
          {typeof title === "string" ? (
            <Text className="text-h3 font-display-bold text-neutral-900 dark:text-white/90 tracking-tight leading-tight">
              {title}
            </Text>
          ) : (
            title
          )}
          
          {description && (
            <View className="mt-3">
              {typeof description === "string" ? (
                <Text className="text-body-lg font-display-medium text-neutral-500 dark:text-neutral-400 leading-snug">
                  {description}
                </Text>
              ) : (
                description
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100).springify()} className="flex-1">
          {children}
        </Animated.View>
      </View>
    </ChatLayoutWrapper>
  );
};

export default AuthTemplate;
