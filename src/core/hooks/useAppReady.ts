import { useFonts } from "expo-font";
import { useEffect, useState } from "react";

export const useAppReady = () => {
  const [fontsLoaded, fontError] = useFonts({
    "SFProDisplay-Regular": require("@/assets/fonts/sf-pro-display/SFPRODISPLAYREGULAR.otf"),
    "SFProDisplay-Medium": require("@/assets/fonts/sf-pro-display/SFPRODISPLAYMEDIUM.otf"),
    "SFProDisplay-Semibold": require("@/assets/fonts/sf-pro-display/SFPRODISPLAYSEMIBOLDITALIC.otf"),
    "SFProDisplay-Bold": require("@/assets/fonts/sf-pro-display/SFPRODISPLAYBOLD.otf"),
  });

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepareApp = async () => {
      try {
        // Put your other initialization tasks here.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn("Error during app initialization:", error);
      } finally {
        if (mounted) {
          setIsAppReady(true);
        }
      }
    };

    prepareApp();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn("Font loading error:", fontError);
    }
  }, [fontError]);

  return isAppReady && (fontsLoaded || !!fontError);
};
