import BotResponse from "@/components/BotResponse";
import CustomHeader from "@/components/CustomHeader";
import MatchDisplay from "@/components/MatchDisplay";
import Roshambo from "@/components/Roshambo";
import TrickBuilder from "@/components/TrickBuilder";
import TrickHistoryList from "@/components/TrickHistoryList";
import TrickHistoryModal from "@/components/TrickHistoryModal";
import { TrickComponents } from "@/constants/trick-options";
import { Difficulty, TrickHistoryEntry } from "@/constants/types";
import { resolveGamePool } from "@/utility/bot-builder";
import {
  buildInitialProgression,
  ProgressionState,
} from "@/utility/bot-offense";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Game() {
  const { offense, difficulty, letters, username, botCardId, botCardType } =
    useLocalSearchParams<{
      offense: string;
      difficulty: Difficulty;
      letters: string;
      username?: string;
      botCardId: string;
      botCardType: "persona" | "custom";
    }>();

  const [botStatus, setBotStatus] = useState("neutral");
  const [botTurn, setBotTurn] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<TrickComponents | undefined>(
    undefined,
  );
  const [currentOffense, setCurrentOffense] = useState<string | null>(
    offense === "roshambo" ? null : offense.toString(),
  );
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [winner, setWinner] = useState<"user" | "bot" | null>(null);
  const [botPool, setBotPool] = useState<BotTrickEntry[]>([]);
  const [resetPool, setResetPool] = useState<BotTrickEntry[]>([]);
  const [progression, setProgression] = useState<ProgressionState | null>(null);
  const [poolReady, setPoolReady] = useState(false);
  const [exhaustedTricks, setExhaustedTricks] = useState<string[]>([]);

  // Resolve the bot pool from the navigation config on mount
  useEffect(() => {
    resolveGamePool(
      {
        botCardId,
        botCardType,
        difficulty:
          botCardType === "custom" ? null : (difficulty as Difficulty),
        turnOrder: "user", // turn order already resolved before this screen
      },
      buildBotPool,
    ).then((resolved) => {
      setBotPool(resolved);
      setResetPool(resolved);
      setProgression(buildInitialProgression(resolved));
      setPoolReady(true);
    });
  }, []);
  const [trickHistory, setTrickHistory] = useState<TrickHistoryEntry[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const appendHistory = (entry: Omit<TrickHistoryEntry, "turn">) => {
    setTrickHistory((prev) => [...prev, { ...entry, turn: prev.length + 1 }]);
  };

  // addLetter returns the new score so callers can pass it directly
  // to appendHistory without reading stale state.
  const addLetter = (player: "user" | "bot"): number => {
    let newScore = 0;
    if (player === "user") {
      setUserScore((prev) => {
        newScore = prev + 1;
        if (newScore >= letters.length) setWinner("bot");
        return newScore;
      });
    }
    if (player === "bot") {
      setBotScore((prev) => {
        newScore = prev + 1;
        if (newScore >= letters.length) setWinner("user");
        return newScore;
      });
    }
    return newScore;
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

  // Roshambo resolved — set offense and kick off the game
  const handleRoshamboResolved = (resolvedOffense: "user" | "bot") => {
    setCurrentOffense(resolvedOffense);
    setBotTurn(resolvedOffense === "bot");
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="battle"
        showBackButton
        rightIconName="time-outline"
        onRightIconPress={() => setHistoryModalVisible(true)}
      />

      <TrickHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        history={trickHistory}
        username={username ?? "You"}
        scoreWord={letters}
      />
      {/* Roshambo gates the game board until offense is resolved */}
      {currentOffense === null ? (
        <Roshambo
          difficulty={difficulty}
          letters={letters}
          onResolved={handleRoshamboResolved}
        />
      ) : (
        <>
          <MatchDisplay
            botStatus={botStatus}
            botLetters={letters.substring(0, botScore)}
            botScore={botScore}
            userStatus="neutral"
            userLetters={letters.substring(0, userScore)}
            userScore={userScore}
            offense={currentOffense}
            scoreWord={letters}
          />

          {winner !== null ? (
            <View style={styles.winnerContainer}>
              <Text style={styles.winnerText}>
                {winner === "user" ? "🏆 You win!" : "🤖 Bot wins!"}
              </Text>
              <TrickHistoryList
                history={trickHistory}
                username={username ?? "You"}
                scoreWord={letters}
              />
              <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
                <Text>EXIT</Text>
              </TouchableOpacity>
            </View>
          ) : !poolReady ? (
            <View style={styles.container}>
              <Text
                style={{ textAlign: "center", color: "#888", marginTop: 40 }}
              >
                Loading...
              </Text>
            </View>
          ) : (
            <>
              {/* User is Offense, otherwise Bot responds on Offense or Defense */}
              {botTurn === false && currentOffense === "user" ? (
                <View style={styles.container}>
                  <TrickBuilder
                    exhaustedTricks={exhaustedTricks}
                    turnSuccess={(result) => {
                      if (result.landed) {
                        setCurrentTrick(result.trickComponents);
                        const trickName = result.trick ?? "";
                        if (trickName)
                          setExhaustedTricks((prev) => [...prev, trickName]);
                        appendHistory({
                          trick: trickName,
                          performer: "user",
                          offense: true,
                          landed: true,
                          performerScore: userScore,
                        });
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
                    resetPool={resetPool}
                    onPoolUpdate={(updatedPool) => setBotPool(updatedPool)}
                    onPoolReset={() => setExhaustedTricks([])}
                    progression={progression!}
                    onProgressionUpdate={(updated) => setProgression(updated)}
                    scoreWord={letters}
                    difficulty={difficulty as Difficulty}
                    currentOffense={currentOffense}
                    userTrick={currentTrick}
                    botResult={(result) => {
                      if (currentOffense === "user") {
                        appendHistory({
                          trick: result.trick ?? "",
                          performer: "bot",
                          offense: false,
                          landed: result.landed,
                          performerScore: result.landed
                            ? botScore
                            : botScore + 1,
                        });
                        if (result.landed) {
                          setBotTurn(false);
                        } else {
                          addLetter("bot");
                          setBotTurn(false);
                        }
                      } else if (currentOffense === "bot") {
                        if (result.landed) {
                          appendHistory({
                            trick: result.trick ?? "",
                            performer: "bot",
                            offense: true,
                            landed: true,
                            performerScore: botScore,
                          });
                          setCurrentTrick(result.trickComponents);
                          if (result.trick)
                            setExhaustedTricks((prev) => [
                              ...prev,
                              result.trick!,
                            ]);
                        } else {
                          setTimeout(() => switchOffense(), 2000);
                        }
                      }
                    }}
                    userResult={(result) => {
                      const trickName =
                        result.trick && result.trick !== ""
                          ? result.trick
                          : (currentTrick?.fullName ?? "");
                      appendHistory({
                        trick: trickName,
                        performer: "user",
                        offense: false,
                        landed: result.landed,
                        performerScore: result.landed
                          ? userScore
                          : userScore + 1,
                      });
                      if (result.landed) {
                        setBotTurn(true);
                      } else {
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  winnerContainer: {
    flex: 1,
    width: "100%",
    height: 340,
    padding: 24,
  },
  winnerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  historyLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginBottom: 12,
    alignSelf: "flex-start",
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
