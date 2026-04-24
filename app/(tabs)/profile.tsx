import CustomHeader from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "../../utility/auth";
import { API_URL } from "../../utility/config";

export default function Profile() {
  const router = useRouter();

  const handleSignOut = async () => {
    const refreshToken = await getRefreshToken();

    try {
      await fetch(`${API_URL}/auth/signout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      // even if the server call fails, clear tokens locally
    }

    await clearTokens();
    router.replace("/(auth)/signin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="profile"
        rightIconName="menu"
        onRightIconPress={() => null}
      />
      <View style={styles.mainContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
