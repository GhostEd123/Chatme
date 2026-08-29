import Logo from "@/assets/icons/logo.svg";
import ThemedButton from "@/shared/components/ThemedButton";
import { IMAGES } from "@/shared/constants/images";
import { useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View className="flex-1  pt-safe-offset-10 items-center justify-around bg-primary-tint relative gap-10.5">
      <Logo />
      <View className=" items-center gap-14">
        <View className="dark:hidden">
          {/* <Ill /> */}
          <Image
            source={IMAGES.onboarding}
            className=" h-[370px]"
            resizeMode="contain"
          />
        </View>
        <View className=" hidden dark:block">
          <Image
            source={IMAGES.onboarding}
            className=" h-[370px]"
            resizeMode="contain"
          />
        </View>
        <View className="items-center w-full pb-safe-offset-5">
          <Text className=" font-display-bold mb-4 text-h3 dark:text-white text-neutral-900 text-center max-w-82 ">
            Stay connected with your friends and family
          </Text>
          <Text className="text-body-md text-neutral-300 text-center  max-w-82 font-display-regular">
            ChatMe is messaging app that will help you to connect with everyone.
          </Text>
        </View>
      </View>

      <View className="w-full max-w-82 justify-end pb-safe-offset-10">
        <ThemedButton
          variant="primary"
          label="Get Started"
          onPress={() => router.navigate("/login")}
        />
      </View>
    </View>
  );
}
