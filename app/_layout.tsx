import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getAccessToken } from "../utility/auth";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      const inAuthGroup = segments[0] === "(auth)";

      if (!token && !inAuthGroup) {
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
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="skate/game" />
        <Stack.Screen name="skate/options" />
        <Stack.Screen name="games/[id]/history" />
      </Stack>
    </SafeAreaProvider>
  );
}
