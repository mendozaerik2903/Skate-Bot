import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ }} />
        <Stack.Screen name="botbattle/pregame" options={{ }} />
        <Stack.Screen name="botbattle/skate" options={{ }} />
        <Stack.Screen name="botbattle/dice" options={{ }} />
    </Stack>
  )
}
