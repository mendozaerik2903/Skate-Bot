import CustomHeader from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const [gamemode, setGamemode] = useState("");

  const routeClassic = () => {
    router.push({
      pathname: "/classic/options",
      params: {},
    });
  };

  const routeDice = () => {
    router.push({
      pathname: "/dice/dice",
      params: {},
    });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <CustomHeader title="skate" />

      <View style={styles.optionContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={routeClassic}>
          <Text style={styles.optionHeading}>Classic</Text>
          <Text style={styles.optionDescription}>
            Classic S.K.A.T.E. game with offense versus defense.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={routeDice}>
          <Text style={styles.optionHeading}>Dice</Text>
          <Text style={styles.optionDescription}>
            Create dice that formulate a random trick every roll.
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  optionContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 30,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 40,
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#1E90FF",
  },
  optionHeading: {
    textAlign: "center",
    fontSize: 30,
  },
  optionDescription: {
    textAlign: "center",
    fontSize: 15,
  },
});
