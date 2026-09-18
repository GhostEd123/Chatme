import AuthTemplate from "@/features/auth/components/Blueprint";
import StyledOtpInput from "@/shared/components/StyledOtpInput";
import ThemedButton from "@/shared/components/ThemedButton";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Text, View } from "react-native";
import { useVerifyOtp } from "../hooks/useVerifyOtp";
import { useAuthStore } from "../store/authStore";

const VerifyScreen = () => {
  const router = useRouter();
  const { user, challengeId, setChallengeId } = useAuthStore();
  const [code, setCode] = useState("");
  const verifyOtp = useVerifyOtp();

  const handleVerify = async () => {
    if (!challengeId || code.length < 4) return;

    try {
      const result = await verifyOtp.mutateAsync({
        challengeId,
        code,
        device: {
          name:
            Platform.OS === "ios"
              ? "iPhone"
              : Platform.OS === "android"
                ? "Android"
                : "Web",
          platform:
            Platform.OS === "ios"
              ? "ios"
              : Platform.OS === "android"
                ? "android"
                : "web",
        },
      });

      // Clear challengeId once used
      setChallengeId(null);

      // If profile is complete navigate to app, else continue setup
      if (result.user.profileComplete && result.user.displayName) {
        // router.replace("/(tabs)" as any);
        router.replace("/chats");
      } else {
        router.push("/(auth)/name");
      }
    } catch (err: any) {
      Alert.alert(
        "Invalid code",
        err?.message ?? "Please check the code and try again.",
      );
    }
  };

  const desc = (
    <Text className="text-body-md font-display-regular text-neutral-300 dark:text-neutral-200 mt-2">
      Enter the code number we sent to{" "}
      <Text className="text-body-md font-display-medium text-neutral-600 dark:text-white/90 mt-2">
        {user?.phone}
      </Text>
    </Text>
  );

  return (
    <AuthTemplate
      goBack
      title="Verification code"
      description={desc}
      buttonProps={{
        onPress: handleVerify,
        disabled: code.length < 4 || verifyOtp.isPending,
      }}
    >
      <View className="gap-2">
        <StyledOtpInput value={code} onChangeText={setCode} length={4} />

        {verifyOtp.isPending ? (
          <View className="flex-row items-center justify-center mt-3 gap-2">
            <ActivityIndicator size="small" color="#57b77d" />
            <Text className="text-body-md text-muted">Verifying…</Text>
          </View>
        ) : (
          <Text className="text-body-md font-display-regular text-neutral-300 dark:text-neutral-200 mt-2 text-center">
            If you don&apos;t get the code, resend it in{" "}
            <Text className="text-body-md font-display-medium text-neutral-600 dark:text-white/90 mt-2 ">
              0
            </Text>{" "}
            seconds.
          </Text>
        )}

        <ThemedButton label="Resend code" variant="tertiary" />
      </View>
    </AuthTemplate>
  );
};

export default VerifyScreen;
