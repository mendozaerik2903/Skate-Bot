import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "red",
        tabBarActiveBackgroundColor: "coral",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons name="skateboard" size={30} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="global"
        options={{
          tabBarIcon: () => (
            <FontAwesome name="globe" size={30} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons name="account" size={30} color="black" />
          ),
        }}
      />
    </Tabs>
  );
}
