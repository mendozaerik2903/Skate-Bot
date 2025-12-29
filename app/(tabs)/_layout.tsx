import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: "red",
        tabBarActiveBackgroundColor: "coral",
    }}>
        <Tabs.Screen 
            name="index" 
            options={{ 
                title: "", 
                tabBarIcon: () => (<MaterialCommunityIcons name="skateboard" size={50} color="black" />),
            }}
        />
        <Tabs.Screen 
            name="global" 
            options={{ 
                title: "", 
                tabBarIcon: () => (<FontAwesome name="globe" size={50} color="black" />),
            }}
        />
        <Tabs.Screen 
            name="profile" 
            options={{ 
                title: "", 
                tabBarIcon: () => (<MaterialCommunityIcons name="account" size={50} color="black" />),
            }}
        />
    </Tabs>
  )
}
