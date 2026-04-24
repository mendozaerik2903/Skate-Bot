import CustomHeader from "@/components/CustomHeader";
import MatchDisplay from "@/components/MatchDisplay";
import { Difficulty } from "@/constants/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const choices = ["rock", "paper", "scissors"];
const emojiMap: Record<string, string> = {
  rock: "✊", // Fist as "rock"
  paper: "✋", // Open hand as "paper"
  scissors: "✌️", // Victory hand as "scissors"
};

export default function Roshambo() {
  const { difficulty, letters } = useLocalSearchParams<{
    difficulty: Difficulty;
    letters: string;
  }>();
  const [userChoice, setUserChoice] = useState(null);
  const [userStatus, setUserStatus] = useState("neutral");
  const [botChoice, setBotChoice] = useState(null);
  const [botStatus, setBotStatus] = useState("neutral");
  const [result, setResult] = useState("");

  const chooseDefense = () => {
    setResult("forfeited");
    setBotStatus("happy");

    // Simulate short delay before navigating to game
    setTimeout(() => {
      router.push({
        pathname: "/classic/game",
        params: {
          offense: "bot",
          difficulty,
          letters,
        },
      });
    }, 2000);
  };

  const playGame = (choice: any) => {
    const bot: any = choices[Math.floor(Math.random() * choices.length)];
    const outcome: any = determineWinner(choice, bot);
    setUserChoice(choice);
    setBotChoice(bot);
    setResult(outcome);

    if (outcome === "tie") {
      setUserStatus("neutral");
      setBotStatus("neutral");
      return;
    }

    // Simulate short delay before navigating to game
    setTimeout(() => {
      router.push({
        pathname: "/classic/game",
        params: {
          offense: outcome === "win" ? "user" : "bot",
          difficulty,
          letters,
        },
      });
    }, 2000);
  };

  const determineWinner = (user: any, bot: any) => {
    if (user === bot) return "tie";
    if (
      (user === "rock" && bot === "scissors") ||
      (user === "paper" && bot === "rock") ||
      (user === "scissors" && bot === "paper")
    ) {
      setUserStatus("happy");
      setBotStatus("angry");
      return "win";
    }
    setUserStatus("defeat");
    setBotStatus("happy");
    return "lose";
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Roshambo" />
      <MatchDisplay
        botStatus={botStatus}
        botLetters={botChoice ? emojiMap[botChoice] : ""}
        botScore={0}
        userStatus={userStatus}
        userLetters={userChoice ? emojiMap[userChoice] : ""}
        userScore={0}
        offense={
          result === "win"
            ? "user"
            : result === "lose"
              ? "bot"
              : result === "forfeited"
                ? "bot"
                : ""
        }
        scoreWord={letters}
      />
      <View style={styles.mainContainer}>
        {(result === "" || result === "tie") && (
          <View style={styles.roshamboContainer}>
            <Text style={styles.title}>Choose Rock, Paper, or Scissors</Text>
            <View style={styles.choiceContainer}>
              {choices.map((choice) => (
                <TouchableOpacity
                  key={choice}
                  style={styles.choiceButton}
                  onPress={() => playGame(choice)}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.choiceContainer}>
              <TouchableOpacity
                style={styles.choiceButton}
                onPress={chooseDefense}
              >
                <Text style={styles.choiceText}>Give up offense</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {result && <Text style={styles.result}>You {result}</Text>}
        {result === "tie" && <Text style={styles.result}>Go again!</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    //flex: .3,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roshamboContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  choiceContainer: {
    flexDirection: "row",
    gap: 16,
  },
  choiceButton: {
    backgroundColor: "#1E90FF",
    padding: 16,
    borderRadius: 8,
  },
  choiceText: {
    color: "#fff",
    fontSize: 18,
  },
  result: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "bold",
  },
});
