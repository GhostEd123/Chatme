module.exports = {
  name: "ChatMe",
  slug: "chatme",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "chatme",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "97e18e3e-bf33-4108-ae19-f4f0ca6db714",
    },
  },
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "com.yourcompany.chatme",
    infoPlist: {
      NSCameraUsageDescription:
        "Allow ChatMe to access your camera for video calls and taking photos.",
      NSMicrophoneUsageDescription:
        "Allow ChatMe to access your microphone for voice notes and calls.",
      NSContactsUsageDescription:
        "Allow ChatMe to access your contacts to connect with friends.",
      NSPhotoLibraryUsageDescription:
        "Allow ChatMe to access your photos to share media.",
      NSPhotoLibraryAddUsageDescription:
        "Allow ChatMe to save photos to your library.",
      NSLocationWhenInUseUsageDescription:
        "Allow ChatMe to access your location to share with friends.",
      NSFaceIDUsageDescription:
        "Allow ChatMe to use FaceID to securely lock your chats.",
    },
  },
  android: {
    package: "com.yourcompany.chatme",
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      backgroundColor: "#0F261E",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_CONTACTS",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F5FEF8",
        image: "./assets/images/splash-icon.png",
        imageWidth: 140,
        dark: {
          backgroundColor: "#081C2C",
          image: "./assets/images/splash-icon.png",
          imageWidth: 140,
        },
      },
    ],
    "expo-secure-store",
    "@config-plugins/react-native-webrtc",
    "expo-audio",
    "expo-sharing",
    [
      "expo-camera",
      {
        cameraPermission: "Allow ChatMe to access your camera.",
        microphonePermission: "Allow ChatMe to access your microphone.",
      },
    ],
    [
      "expo-contacts",
      {
        contactsPermission: "Allow ChatMe to access your contacts.",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow ChatMe to use your location.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission: "Allow ChatMe to access your photos.",
        savePhotosPermission: "Allow ChatMe to save photos.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to let you share them with your friends.",
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow ChatMe to use Face ID.",
      },
    ],
    "expo-document-picker",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
