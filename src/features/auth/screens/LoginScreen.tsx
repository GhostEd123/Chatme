import Spacer from "@/shared/components/Spacer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import AuthTemplate from "../components/Blueprint";
import { CountryPicker } from "../components/CountryPicker";
import {
  LoginFormInput,
  LoginFormOutput,
  loginSchema,
} from "../schemas/loginSchema";
import { useAuthStore } from "../store/authStore";
import { useRequestOtp } from "../hooks/useRequestOtp";

const LoginScreen = () => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput, any, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      country: null,
    },
    mode: "onChange",
  });
  const router = useRouter();
  const { updateUser, setChallengeId } = useAuthStore();
  const requestOtp = useRequestOtp();

  const onSubmit = async (data: LoginFormOutput) => {
    let digits = data.phone.replace(/\D/g, "");
    if (data.country.code === "NG" && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    const e164 = `${data.country.dialCode}${digits}`;
    updateUser({ phone: e164 });

    try {
      const res = await requestOtp.mutateAsync({ phoneNumber: e164 });
      setChallengeId(res.challengeId);
      router.navigate("/(auth)/verify");
    } catch (err: any) {
      Alert.alert(
        "Failed to send code",
        err?.message ?? "Please check your number and try again."
      );
    }
  };

  const onError = (errors: any) => {
    console.log("Validation Failed!", errors);
  };

  return (
    <AuthTemplate
      title="What's your phone number?"
      description="We will send you the verification code."
      buttonProps={{
        onPress: handleSubmit(onSubmit, onError),
        disabled: requestOtp.isPending,
      }}
    >
      <View className="flex-1">
        <Text className="text-body-md font-display-medium text-neutral-600 dark:text-neutral-50 px-1">
          Phone Number
        </Text>
        <Spacer size={8} />
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange } }) => (
            <CountryPicker
              value={value}
              onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
              onCountryChange={(country) =>
                setValue("country", country, { shouldValidate: true })
              }
            />
          )}
        />
        {errors.phone && (
          <Text className="text-red-400 text-body-sm mt-1 px-1">
            {errors.phone.message}
          </Text>
        )}
        {errors.country && (
          <Text className="text-red-400 text-body-sm mt-1 px-1">
            {errors.country.message}
          </Text>
        )}
        {requestOtp.isPending && (
          <View className="flex-row items-center mt-3 gap-2">
            <ActivityIndicator size="small" color="#57b77d" />
            <Text className="text-body-sm text-muted">Sending code…</Text>
          </View>
        )}
      </View>
    </AuthTemplate>
  );
};

export default LoginScreen;
