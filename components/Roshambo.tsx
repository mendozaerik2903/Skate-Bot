import MatchDisplay from "@/components/MatchDisplay";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const choices = ["rock", "paper", "scissors"];
const emojiMap: Record<string, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

interface RoshamboProps {
  letters: string;
  onResolved: (offense: "user" | "bot") => void;
}

export default function Roshambo({ letters, onResolved }: RoshamboProps) {
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState("neutral");
  const [botChoice, setBotChoice] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState("neutral");
  const [result, setResult] = useState("");

  const playGame = (choice: string) => {
    const bot = choices[Math.floor(Math.random() * choices.length)];
    const outcome = determineWinner(choice, bot);
    setUserChoice(choice);
    setBotChoice(bot);
    setResult(outcome);

    if (outcome === "tie") {
      setUserStatus("neutral");
      setBotStatus("neutral");
      return;
    }

    setTimeout(() => {
      onResolved(outcome === "win" ? "user" : "bot");
    }, 2000);
  };

  const determineWinner = (user: string, bot: string): string => {
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
    <View style={styles.container}>
      <MatchDisplay
        botStatus={botStatus}
        botLetters={botChoice ? emojiMap[botChoice] : ""}
        botScore={0}
        userStatus={userStatus}
        userLetters={userChoice ? emojiMap[userChoice] : ""}
        userScore={0}
        offense={result === "win" ? "user" : result === "lose" ? "bot" : ""}
        scoreWord={letters}
      />

      <View style={styles.mainContainer}>
        {(result === "" || result === "tie") && (
          <View style={styles.roshamboContainer}>
            <Text style={styles.rulesText}>Winner goes on offense first.</Text>
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
          </View>
        )}

        {result && result !== "tie" && (
          <Text style={styles.result}>You {result}</Text>
        )}
        {result === "tie" && <Text style={styles.result}>Go again!</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
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
  rulesText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
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
