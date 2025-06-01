import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarActiveTintColor: "red"
    }}>
        <Tabs.Screen name="index" options={{ title: "Skate", headerShown: false}} />
        <Tabs.Screen name="profile" options={{ title: "Profile", headerShown: false }} />
    </Tabs>
  )
}
