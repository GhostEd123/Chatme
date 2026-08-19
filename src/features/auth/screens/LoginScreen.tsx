import Spacer from "@/shared/components/Spacer";
import { formatPhoneInternational } from "@/shared/utils/formatPhoneNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import AuthTemplate from "../components/Blueprint";
import { CountryPicker } from "../components/CountryPicker";
import {
  LoginFormInput,
  LoginFormOutput,
  loginSchema,
} from "../schemas/loginSchema";
import NumpadWidget from "@/shared/widgets/NumpadWidget";
import { useAuthStore } from "../store/authStore";

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
  const { updateUser } = useAuthStore();
  const onSubmit = (data: LoginFormOutput) => {
    const e164 = `${data.country.dialCode}${data.phone.replace(/\D/g, "")}`;
    updateUser({ phone: e164 });
    router.navigate("/(auth)/verify");
  };
  const onError = (errors: any) => {
    console.log("Validation Failed!", errors);
  };

  const handleNumpadPress = (val: string) => {
    const current = control._formValues.phone || "";
    setValue("phone", current + val, { shouldValidate: true });
  };

  const handleNumpadBackspace = () => {
    const current = control._formValues.phone || "";
    setValue("phone", current.slice(0, -1), { shouldValidate: true });
  };

  return (
    <AuthTemplate
      title="What's your phone number?"
      description="We will send you the verification code."
      buttonProps={{
        onPress: handleSubmit(onSubmit, onError),
      }}
      bottomWidget={
        <NumpadWidget
          onPress={handleNumpadPress}
          onBackspace={handleNumpadBackspace}
        />
      }
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
              onChangeText={(text) => onChange(formatPhoneInternational(text))}
              onCountryChange={(country) =>
                setValue("country", country, { shouldValidate: true })
              }
              disableNativeKeyboard
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
      </View>
    </AuthTemplate>
  );
};

export default LoginScreen;
