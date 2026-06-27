import CustomHeader from "@/components/CustomHeader";
import TrickHistoryList from "@/components/TrickHistoryList";
import { useGameTrickHistory } from "@/hooks/useGameTrickHistory";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GameHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, game, isLoading, error } = useGameTrickHistory(id ?? null);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="match history" showBackButton />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error || !game ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn&apos;t load this match.</Text>
        </View>
      ) : (
        <TrickHistoryList
          history={history}
          username="Skater"
          scoreWord={game.score_word}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#888",
  },
});
