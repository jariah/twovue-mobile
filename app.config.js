export default {
  expo: {
    name: "twovue-mobile",
    slug: "twovue-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Twovue needs camera access to take photos for the game",
        NSPhotoLibraryAddUsageDescription: "Twovue saves photos to your camera roll"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      permissions: ["CAMERA", "WRITE_EXTERNAL_STORAGE"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Twovue to access your camera to take photos for the game"
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow Twovue to save photos to your photo library",
          "savePhotosPermission": "Allow Twovue to save photos to your photo library",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}; 