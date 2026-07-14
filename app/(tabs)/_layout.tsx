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
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              {(color) => (
                <MaterialCommunityIcons name="skateboard" size={26} color={color} />
              )}
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="global"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              {(color) => <FontAwesome name="globe" size={26} color={color} />}
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              {(color) => <FontAwesome name="circle" size={26} color={color} />}
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused}>
              {(color) => (
                <MaterialCommunityIcons name="account" size={26} color={color} />
              )}
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const ACTIVE_COLOR = "#0070FF";
const INACTIVE_COLOR = "#111";

type Props = {
  focused: boolean;
  children: (color: string) => React.ReactNode;
};

export function TabIcon({ focused, children }: Props) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [focused]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", ACTIVE_COLOR],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <Animated.View style={[styles.pill, { backgroundColor, transform: [{ scale }] }]}>
      {children(focused ? "#fff" : INACTIVE_COLOR)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});