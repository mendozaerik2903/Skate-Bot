import CustomHeader from "@/components/CustomHeader";
import { clearGuestData } from "@/utility/guest-mode";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type GuestUpsellProps = {
  // Header title, lowercase to match the existing tab headers ("map", "profile")
  title: string;
  // Human-readable feature name slotted into the body copy, e.g. "the Map" or "your Profile"
  feature: string;
};

  const handleLogOutOfGuestMode = () => {
    Alert.alert(
      "Log out of guest mode?",
      "Doing this will delete your guest data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await clearGuestData();
            router.replace("/(auth)/signin");
          },
        },
      ],
    );
  };

export default function GuestUpsell({ title, feature }: GuestUpsellProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader title={title} />
      <View style={styles.content}>
        <Text style={styles.heading}>Sign up to use {feature}</Text>
        <Text style={styles.body}>
          By creating an account you transfer your guest data and gain access to {feature}.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={handleLogOutOfGuestMode}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});