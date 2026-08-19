import AuthTemplate from "@/features/auth/components/Blueprint";
import StyledOtpInput from "@/shared/components/StyledOtpInput";
import ThemedButton from "@/shared/components/ThemedButton";
import NumpadWidget from "@/shared/widgets/NumpadWidget";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useAuthStore } from "../store/authStore";

const VerifyScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [code, setCode] = useState("");

  const handleNumpadPress = (val: string) => {
    if (code.length < 4) {
      setCode((prev) => prev + val);
    }
  };

  const handleNumpadBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };
  const desc = (
    <Text className="text-body-md font-display-regular text-neutral-300 dark:text-neutral-200 mt-2">
      Enter the code number we sent to{" "}
      <Text className="text-body-md font-display-medium text-neutral-600 dark:text-white/90 mt-2">
        {user?.phone || "+62 85-830-544-382"}
      </Text>
    </Text>
  );
  return (
    <AuthTemplate
      goBack
      title="Verification code"
      description={desc}
      buttonProps={{
        onPress: () => router.navigate("/(auth)/name"),
        disabled: code.length < 4,
      }}
      bottomWidget={
        <NumpadWidget
          onPress={handleNumpadPress}
          onBackspace={handleNumpadBackspace}
        />
      }
    >
      <View className="gap-2">
        <StyledOtpInput value={code} length={4} />
        <Text className="text-body-md font-display-regular text-neutral-300 dark:text-neutral-200 mt-2 text-center">
          If you don&apos;t get the code, resend it in{" "}
          <Text className="text-body-md font-display-medium text-neutral-600 dark:text-white/90 mt-2 ">
            0
          </Text>{" "}
          seconds.
        </Text>

        <ThemedButton label="Resend code" variant="tertiary" />
      </View>
    </AuthTemplate>
  );
};

export default VerifyScreen;
