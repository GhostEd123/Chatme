import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { withUniwind } from "uniwind";
import CameraCapture from "./CameraCapture";

const StyledMaterialCommunityIcons = withUniwind(MaterialCommunityIcons);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type ModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onImageSelected?: (uri: string) => void;
};

export default function UploadModal({
  modalVisible,
  setModalVisible,
  onImageSelected,
}: ModalProps) {
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [recentPhotos, setRecentPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  // Controls whether the RN <Modal> is actually mounted, so the
  // close animation can finish before it unmounts.
  const [isRendered, setIsRendered] = useState(modalVisible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const loadRecentPhotos = useCallback(async () => {
    try {
      let perm = mediaPermission;
      if (!perm || perm.status !== "granted") {
        perm = await requestMediaPermission();
      }
      if (!perm.granted) return;

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        sortBy: "creationTime",
        first: 20,
      });
      setRecentPhotos(assets);
    } catch (err) {
      console.warn("Failed to load recent photos", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modalVisible) {
      setIsRendered(true);
      loadRecentPhotos();
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setIsRendered(false));
    }
  }, [modalVisible, backdropOpacity, translateY, loadRecentPhotos]);

  const handleClose = () => setModalVisible(false);

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      onImageSelected?.(result.assets[0].uri);
      handleClose();
    }
  };

  const handleSelectRecent = (asset: MediaLibrary.Asset) => {
    onImageSelected?.(asset.uri);
    handleClose();
  };

  return (
    <>
      <Modal
        visible={isRendered}
        animationType="none"
        transparent
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <AnimatedPressable
          className="flex-1 justify-end bg-neutral-900/40 p-6"
          style={{ opacity: backdropOpacity }}
          onPress={handleClose}
        >
          <Animated.View
            style={{ transform: [{ translateY }] }}
            className="w-full"
          >
            <Pressable className="w-full min-h-42 h-fit bg-white dark:bg-neutral-700 rounded-2xl pb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex-row pt-4 px-4 gap-3"
              >
                {/* Camera Item */}
                <Pressable
                  onPress={() => setShowCamera(true)}
                  className="items-center justify-center active:opacity-80 size-16 bg-neutral-900/40 rounded-lg"
                >
                  <StyledMaterialCommunityIcons
                    name="camera"
                    size={28}
                    className="text-white/90"
                  />
                </Pressable>

                {/* Recent Gallery Items */}
                {recentPhotos.map((asset) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => handleSelectRecent(asset)}
                    className="active:opacity-80 size-16 rounded-lg overflow-hidden bg-neutral-900/10"
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      className="size-16"
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Action List */}
              <View className="p-4 gap-2 mt-2">
                <Pressable
                  onPress={() => setShowCamera(true)}
                  className="flex-row gap-4 active:opacity-80 h-10 items-center px-2"
                >
                  <StyledMaterialCommunityIcons
                    name="camera"
                    size={24}
                    className="text-primary-400"
                  />
                  <Text className="w-fit text-neutral-600 dark:text-white/90 text-body-lg font-display-medium">
                    Take Photo
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handlePickFromGallery}
                  className="flex-row gap-4 active:opacity-80 h-10 items-center px-2"
                >
                  <StyledMaterialCommunityIcons
                    name="image"
                    size={24}
                    className="text-primary-400"
                  />
                  <Text className="w-fit text-neutral-600 dark:text-white/90 text-body-lg font-display-medium">
                    Choose From Gallery
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </AnimatedPressable>
      </Modal>

      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(uri) => {
          setShowCamera(false);
          onImageSelected?.(uri);
          handleClose();
        }}
      />
    </>
  );
}
