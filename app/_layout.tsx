import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getAccessToken } from "../utility/auth";
import { isGuestMode } from "../utility/guest-mode";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      const guest = await isGuestMode();
      const inAuthGroup = segments[0] === "(auth)";

      const hasAccess = Boolean(token) || guest;

      if (!hasAccess && !inAuthGroup) {
        router.replace("/(auth)/signin");
      } else if (token && inAuthGroup) {
        router.replace("/(tabs)");
      }

      setIsReady(true);
    };

    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="skate/game" />
          <Stack.Screen name="skate/options" />
          <Stack.Screen name="skate/bot-edit" />
          <Stack.Screen name="games/[id]/history" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="dark"/>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}