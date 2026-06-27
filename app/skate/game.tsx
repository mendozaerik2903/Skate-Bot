import BotResponse from "@/components/BotResponse";
import CustomHeader from "@/components/CustomHeader";
import MatchDisplay from "@/components/MatchDisplay";
import Roshambo from "@/components/Roshambo";
import TrickBuilder from "@/components/TrickBuilder";
import TrickHistoryList from "@/components/TrickHistoryList";
import TrickHistoryModal from "@/components/TrickHistoryModal";
import { DEFAULT_DIFFICULTY_VALUE } from "@/constants/difficulty";
import { TrickComponents } from "@/constants/trick-options";
import { Difficulty, TrickHistoryEntry } from "@/constants/types";
import { buildCarousel, resolveGamePool } from "@/utility/bot-builder";
import {
  buildInitialProgression,
  ProgressionState,
} from "@/utility/bot-offense";
import { fetchWithAuth, SessionExpiredError } from "@/utility/fetchWithAuth";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Game() {
  const { offense, difficulty, letters, username, botCardId, botCardType } =
    useLocalSearchParams<{
      offense: string;
      difficulty: string;
      letters: string;
      username?: string;
      botCardId: string;
      botCardType: "persona" | "custom";
    }>();

  // useLocalSearchParams always deserializes route params as strings,
  // regardless of the TS annotation above — `difficulty as Difficulty` was
  // a type-only cast that never actually parsed the string to a number.
  // Number(...) does the real conversion; Number(undefined) and
  // Number("") both produce NaN (not null/undefined), so the guard here is
  // an explicit Number.isNaN check rather than `??` — and deliberately not
  // a `? :` truthy check, since 0 is a valid, falsy difficulty value that
  // must not be treated as missing.
  //
  // Custom-mode games now also use the difficulty scalar (it's a
  // non-destructive multiplier on top of the saved pool, applied in
  // resolveGamePool) — no longer forced to null here.
  const parsedDifficulty = Number(difficulty);
  const resolvedDifficulty: Difficulty = Number.isNaN(parsedDifficulty)
    ? DEFAULT_DIFFICULTY_VALUE
    : parsedDifficulty;

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
        difficulty: resolvedDifficulty,
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
  const hasSavedGameRef = useRef(false);

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

  // Persist the completed match once a winner is determined. Guarded by
  // hasSavedGameRef so this can't double-fire across re-renders while
  // winner remains set (the async race this protects against is the same
  // class of bug as the stale-closure / duplicate-fire patterns elsewhere
  // in this game's bot logic).
  useEffect(() => {
    if (winner === null || hasSavedGameRef.current) return;
    hasSavedGameRef.current = true;

    async function saveGame() {
      try {
        const carousel = await buildCarousel();
        const botCard = carousel.find((card) => card.id === botCardId);
        const botPersonaName = botCard?.name ?? "Unknown bot";

        const turns = trickHistory.map((entry) => ({
          turnNumber: entry.turn,
          isOffense: entry.offense,
          isUserTurn: entry.performer === "user",
          trickName: entry.trick,
          landed: entry.landed,
        }));

        await fetchWithAuth("/games", {
          method: "POST",
          body: JSON.stringify({
            won: winner === "user",
            botPersona: botPersonaName,
            scoreWord: letters,
            turns,
          }),
        });
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          // The user's session is gone — saving silently and leaving them
          // on the win screen would mean their next action elsewhere in
          // the app fails with no warning. Redirect now, with the win
          // screen already having been seen.
          router.replace("/signin");
          return;
        }

        // Any other failure (network, server error) should never block
        // the win screen from showing — log and move on rather than
        // surfacing an error to a user who just finished a game.
        console.error("Failed to save game:", err);
      }
    }

    saveGame();
  }, [winner]);

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
      {/* Roshambo gates the game until offense is resolved */}
      {currentOffense === null ? (
        <Roshambo letters={letters} onResolved={handleRoshamboResolved} />
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
              <View
                style={[
                  styles.winnerBanner,
                  winner === "user"
                    ? styles.winnerBannerWin
                    : styles.winnerBannerLoss,
                ]}
              >
                <Text style={styles.winnerEmoji}>
                  {winner === "user" ? "🏆" : "🤖"}
                </Text>
                <Text
                  style={[
                    styles.winnerText,
                    winner === "user"
                      ? styles.winnerTextWin
                      : styles.winnerTextLoss,
                  ]}
                >
                  {winner === "user" ? "You win!" : "Bot wins!"}
                </Text>
              </View>

              <View style={styles.historyScroll}>
                <TrickHistoryList
                  history={trickHistory}
                  username={username ?? "You"}
                  scoreWord={letters}
                />
              </View>

              <TouchableOpacity
                style={styles.exitButton}
                onPress={() => router.replace("/(tabs)")}
              >
                <Text style={styles.exitButtonText}>Exit</Text>
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
                    difficulty={resolvedDifficulty}
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
    padding: 24,
  },
  winnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 18,
    marginBottom: 16,
  },
  winnerBannerWin: {
    backgroundColor: "#E6F4EA",
  },
  winnerBannerLoss: {
    backgroundColor: "#F2F2F2",
  },
  winnerEmoji: {
    fontSize: 28,
  },
  winnerText: {
    fontSize: 26,
    fontWeight: "bold",
  },
  winnerTextWin: {
    color: "#1E7A3D",
  },
  winnerTextLoss: {
    color: "#555",
  },
  historyScroll: {
    flex: 1,
  },
  exitButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  exitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
