import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledMaterialCommunityIcons = withUniwind(MaterialCommunityIcons);

type CameraCaptureProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
};

export default function CameraCapture({
  visible,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);

  if (visible && !permission?.granted) {
    // Fire off the request; render nothing until the user responds.
    requestPermission();
  }

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) onCapture(photo.uri);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {permission?.granted && (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
        )}

        {/* Top bar */}
        <View className="absolute top-14 left-0 right-0 flex-row justify-between px-6">
          <Pressable
            onPress={onClose}
            className="size-11 items-center justify-center rounded-full bg-black/40"
          >
            <StyledMaterialCommunityIcons
              name="close"
              size={24}
              className="text-white"
            />
          </Pressable>
          <Pressable
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            className="size-11 items-center justify-center rounded-full bg-black/40"
          >
            <StyledMaterialCommunityIcons
              name="camera-flip-outline"
              size={24}
              className="text-white"
            />
          </Pressable>
        </View>

        {/* Shutter */}
        <View className="absolute bottom-12 left-0 right-0 items-center">
          <Pressable
            onPress={handleCapture}
            className="size-20 rounded-full border-4 border-white/90 items-center justify-center active:opacity-80"
          >
            <View className="size-16 rounded-full bg-white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
