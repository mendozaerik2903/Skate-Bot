import BotResponse from "@/components/BotResponse";
import CustomHeader from "@/components/CustomHeader";
import MatchDisplay from "@/components/MatchDisplay";
import TrickBuilder from "@/components/TrickBuilder";
import { BOT_TRICKS } from "@/constants/bot-tricks";
import { TrickComponents } from "@/constants/trick-options";
import { Difficulty } from "@/constants/types";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Game() {
  const { offense, difficulty, letters } = useLocalSearchParams<{
    offense: string;
    difficulty: Difficulty;
    letters: string;
  }>();
  const word = letters;
  const [botStatus, setBotStatus] = useState("neutral");
  const [botTurn, setBotTurn] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<TrickComponents | undefined>(
    undefined,
  );
  const [currentOffense, setCurrentOffense] = useState(offense.toString());
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [winner, setWinner] = useState<"user" | "bot" | null>(null);
  const [botPool, setBotPool] = useState<BotTrickEntry[]>(() =>
    buildBotPool(BOT_TRICKS[difficulty]),
  );
  const [exhaustedTricks, setExhaustedTricks] = useState<string[]>([]);

  const addLetter = (player: "user" | "bot") => {
    if (player === "user") {
      setUserScore((prev) => {
        const updatedScore = prev + 1;
        if (updatedScore >= letters.length) setWinner("bot");
        return updatedScore;
      });
    }
    if (player === "bot") {
      setBotScore((prev) => {
        const updatedScore = prev + 1;
        if (updatedScore >= letters.length) setWinner("user");
        return updatedScore;
      });
    }
  };

  const switchOffense = () => {
    if (currentOffense === "user") {
      setCurrentOffense("bot");
      setBotTurn(true);
    } else {
      setCurrentOffense("user");
      setBotTurn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="battle" showBackButton />
      <MatchDisplay
        botStatus={botStatus}
        botLetters={letters.substring(0, botScore)}
        botScore={botScore}
        userStatus="neutral"
        userLetters={letters.substring(0, userScore)}
        userScore={userScore}
        offense={currentOffense} // 'bot' or 'user'
        scoreWord={letters}
      />

      {winner !== null ? (
        <View>
          <Text>The {winner} wins!</Text>
        </View>
      ) : (
        <>
          {botTurn === false && currentOffense === "user" ? (
            <View style={styles.container}>
              <TrickBuilder
                exhaustedTricks={exhaustedTricks}
                turnSuccess={(result) => {
                  if (result.landed) {
                    setCurrentTrick(result.trickComponents);
                    if (result.trick)
                      setExhaustedTricks((prev) => [...prev, result.trick!]);
                    setBotTurn(true);
                  } else {
                    switchOffense();
                  }
                }}
              />
            </View>
          ) : (
            <View style={styles.container}>
              <BotResponse
                exhaustedTricks={exhaustedTricks}
                onTrickExhausted={(trick) =>
                  setExhaustedTricks((prev) => [...prev, trick])
                }
                botPool={botPool}
                onPoolUpdate={(updatedPool) => setBotPool(updatedPool)}
                scoreWord={letters}
                difficulty={difficulty as Difficulty}
                currentOffense={currentOffense}
                userTrick={currentTrick}
                botResult={(result) => {
                  // bot sets new trick for user
                  if (currentOffense === "user") {
                    if (result.landed) {
                      setBotTurn(false);
                    } else {
                      addLetter("bot");
                      setBotTurn(false);
                    }
                  } else if (currentOffense === "bot") {
                    if (result.landed) {
                      setCurrentTrick(result.trickComponents);
                      if (result.trick)
                        setExhaustedTricks((prev) => [...prev, result.trick!]);
                    } else {
                      switchOffense();
                    }
                  }
                }}
                userResult={(result) => {
                  if (result.landed) setBotTurn(true);
                  if (!result.landed) {
                    addLetter("user");
                    setBotTurn(true);
                  }
                }}
                botScore={botScore}
                userScore={userScore}
              />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  ); // END SkateScreen return
} // END SkateScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
