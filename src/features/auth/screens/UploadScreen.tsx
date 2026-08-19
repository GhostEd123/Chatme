import UploadBgDark from "@/assets/images/upload-bg-dark.svg";
import UploadBg from "@/assets/images/upload-bg.svg";
import UploadIcon from "@/assets/images/upload-icon.svg";
import UploadRect from "@/assets/images/upload-rect.svg";
import UploadModal from "@/features/auth/components/UploadModal";
import ThemedButton from "@/shared/components/ThemedButton";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledMaterialIcons = withUniwind(MaterialIcons);
const StyledFeather = withUniwind(Feather);
const StyledMaterialCommunityIcons = withUniwind(MaterialCommunityIcons);
const StyledUploadIcon = withUniwind(UploadIcon);
const StyledUploadBg = withUniwind(UploadBg);
const StyledUploadBgDark = withUniwind(UploadBgDark);
export default function UploadScreen() {
  const router = useRouter();
  const handleBack = () => router.back();
  const pushToHome = () => router.push("/chats");
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View className="p-safe-offset-6 gap-6 flex-1">
      <Pressable
        onPress={handleBack}
        hitSlop={8}
        className="size-10 rounded-xl border-2 border-border flex items-center justify-center"
      >
        <StyledFeather
          name="chevron-left"
          size={24}
          colorClassName="accent-neutral-900 dark:accent-white/90"
        />
      </Pressable>

      <View className="max-w-96 gap-1">
        <Text className="text-h3 font-display-bold text-neutral-900 dark:text-white/90 text-center">
          Upload a profile picture
        </Text>
      </View>
      <View className="flex-1 items-center pt-30">
        <Pressable onPress={() => setModalVisible(true)} className="relative">
          <View className="size-41  rounded-[100px] flex items-center justify-center relative overflow-hidden">
            <StyledUploadBg className="dark:hidden" />
            <StyledUploadBgDark className="hidden dark:block" />
            <View className="absolute top-12 w-fit h-fit">
              <UploadRect />
              {/*if not uploading show this*/}
              <StyledUploadIcon className="absolute top-4 left-[57] -translate-x-1/2" />

              {/*else show this*/}
              <View className="justify-center items-center absolute top-6 left-[57] -translate-x-1/2 hidden">
                <StyledMaterialCommunityIcons
                  name="upload-outline"
                  size={24}
                  colorClassName="accent-primary-400"
                />
                <ActivityIndicator
                  className="absolute"
                  colorClassName="accent-primary-400"
                  size={58}
                />
              </View>
            </View>
          </View>
          <View className="size-10 rounded-full bg-primary-400 flex items-center justify-center top-0 right-0 absolute ">
            <StyledMaterialCommunityIcons
              name="camera-plus"
              size={20}
              colorClassName="accent-white/90"
              // className="hidden"
            />
            <StyledMaterialIcons
              name="mode-edit"
              size={20}
              colorClassName="accent-white/90"
              className="hidden"
            />
            <StyledMaterialCommunityIcons
              name="check"
              size={20}
              colorClassName="accent-white/90"
              className="hidden"
            />
          </View>
        </Pressable>
        <Text className="text-body-lg  font-display-medium text-neutral-300 dark:text-neutral-200 mt-4 text-center max-w-46.5">
          Wait a second, your photo is being uploaded.
        </Text>
      </View>
      <View className="px-safe-offset-6 pb-4 ">
        <ThemedButton label="Next" variant="primary" onPress={pushToHome} />
      </View>
      <UploadModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </View>
  );
}
