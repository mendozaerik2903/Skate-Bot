import CustomHeader from "@/components/CustomHeader";
import SegmentedControl from "@/components/SegmentedControl";
import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Options() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [letters, setLetters] = useState("SK8");

  const routeGame = () => {
    router.push({
      pathname: "/classic/roshambo",
      params: { difficulty, letters },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Classic" showBackButton />

      <ScrollView contentContainerStyle={styles.mainContainer}>
        <TouchableOpacity onPress={routeGame}>
          <Text>Start game</Text>
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          <Text>Difficulty</Text>
          <SegmentedControl
            options={["Easy", "Medium", "Hard", "Custom"]}
            selected={difficulty}
            onSelect={setDifficulty}
            strict
          />
          <Text>Letters</Text>
          <SegmentedControl
            options={["SK8", "SKATE", "SKATEBOARD"]}
            selected={letters}
            onSelect={setLetters}
            strict
          />
        </View>

        <View style={styles.optionsContainer}></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    padding: 16,
    backgroundColor: "gray",
  },
});
