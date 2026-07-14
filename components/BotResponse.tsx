import { TrickComponents } from "@/constants/trick-options";
import { AttemptResults, Difficulty } from "@/constants/types";
import { attemptDefenseTrick } from "@/utility/bot-defense";
import { botOffenseTurn, ProgressionState } from "@/utility/bot-offense";
import { BotTrickEntry } from "@/utility/pool-builder";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import RollingSkateboard from "./RollingSkateboard";
import TrickResponse from "./TrickResponse";

interface BotResponseProps {
  scoreWord: string;
  difficulty: Difficulty;
  currentOffense: string;
  userTrick?: TrickComponents;
  botResult: (result: AttemptResults) => void;
  userResult: (result: AttemptResults) => void;
  botScore: number;
  userScore: number;
  botPool: BotTrickEntry[];
  resetPool: BotTrickEntry[];
  onPoolUpdate: (updatedPool: BotTrickEntry[]) => void;
  onPoolReset: () => void;
  progression: ProgressionState;
  onProgressionUpdate: (updated: ProgressionState) => void;
  exhaustedTricks: string[];
  onTrickExhausted: (trick: string) => void;
}

export default function BotResponse({
  scoreWord,
  difficulty,
  currentOffense,
  userTrick,
  botResult,
  userResult,
  botScore,
  userScore,
  botPool,
  resetPool,
  onPoolUpdate,
  onPoolReset,
  progression,
  onProgressionUpdate,
  exhaustedTricks,
  onTrickExhausted,
}: BotResponseProps) {
  const [selectedTrick, setSelectedTrick] = useState<string>("");
  const [landedTrick, setLandedTrick] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [turns, setTurns] = useState(0);
  const [isRedemption, setIsRedemption] = useState(false);
  const [isBotRedemption, setIsBotRedemption] = useState(false);

  const hasFiredRef = useRef(false);

  useEffect(() => {
    hasFiredRef.current = false;
    setIsLoading(true);

    if (currentOffense === "bot") {
      const timeout = setTimeout(() => {
        const availablePool = botPool.filter(
          (e) => !exhaustedTricks.includes(e.fullString),
        );
        const turn = botOffenseTurn(availablePool, resetPool, progression);
        setSelectedTrick(turn.entry.fullString);
        setLandedTrick(turn.success);
        onPoolUpdate(turn.updatedPool);
        onProgressionUpdate(turn.updatedProgression);
        if (turn.success) onTrickExhausted(turn.entry.fullString);
        if (turn.poolWasReset) {
          onPoolReset();
          console.log("Bot trick pool was reset");
        }
        if (turn.tierAdvanced)
          console.log(
            "Progression window advanced to tier",
            turn.updatedProgression.activeTier,
          );
        setIsLoading(false);

        if (!hasFiredRef.current) {
          hasFiredRef.current = true;
          botResult({
            offense: true,
            trick: turn.entry.fullString,
            landed: turn.success,
            score: botScore,
          });
        }
      }, 1800);
      return () => clearTimeout(timeout);
    }

    if (currentOffense === "user" && userTrick) {
      const timeout = setTimeout(() => {
        const botDefenseSuccess = attemptDefenseTrick(difficulty, userTrick!);
        const isBotOnMatchPoint = scoreWord.length - 1 === botScore;

        setSelectedTrick(userTrick.fullName);
        setLandedTrick(botDefenseSuccess);
        setIsLoading(false);

        if (!botDefenseSuccess && isBotOnMatchPoint) {
          setIsBotRedemption(true);

          const redemptionTimeout = setTimeout(() => {
            setSelectedTrick("");
            setLandedTrick(false);
            setIsLoading(true);

            setTimeout(() => {
              const redemptionSuccess = attemptDefenseTrick(
                difficulty,
                userTrick!,
              );
              setSelectedTrick(userTrick.fullName);
              setLandedTrick(redemptionSuccess);
              setIsLoading(false);
              setIsBotRedemption(false);

              setTimeout(() => {
                if (hasFiredRef.current) return;
                hasFiredRef.current = true;
                botResult({
                  offense: false,
                  trick: userTrick.fullName,
                  landed: redemptionSuccess,
                  score: botScore,
                });
              }, 2000);
            }, 1800);
          }, 2200);

          return () => clearTimeout(redemptionTimeout);
        }

        const resultDelay = setTimeout(() => {
          if (hasFiredRef.current) return;
          hasFiredRef.current = true;
          botResult({
            offense: false,
            trick: userTrick.fullName,
            landed: botDefenseSuccess,
            score: botScore,
          });
        }, 2000);
        return () => clearTimeout(resultDelay);
      }, 1800);
      return () => clearTimeout(timeout);
    }

    setIsLoading(false);
  }, [turns]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View>
          <Text style={styles.text}>
            {currentOffense === "bot"
              ? "Bot is picking a trick..."
              : isBotRedemption
                ? "Bot gets a second chance..."
                : `Bot is attempting your ${userTrick?.fullName}`}
          </Text>
          <RollingSkateboard />
        </View>
      ) : (
        <View>
          <Text style={styles.text}>
            Bot {landedTrick ? "landed" : "missed"} a:
          </Text>
          <Text style={styles.trick}>{selectedTrick}</Text>
          {landedTrick && currentOffense === "bot" && (
            <View>
              <Text style={styles.text}>
                {isRedemption
                  ? "Second chance to land this trick!"
                  : "Were you able to replicate this trick?"}
              </Text>

              <TrickResponse
                onLanded={() => {
                  userResult({
                    offense: false,
                    trick: selectedTrick,
                    landed: true,
                    score: userScore,
                  });
                  setIsRedemption(false);
                  setLandedTrick(false);
                  setSelectedTrick("");
                  setTurns(turns + 1);
                }}
                onMissed={() => {
                  if (
                    scoreWord.length - 1 === userScore &&
                    isRedemption === false
                  ) {
                    setIsRedemption(true);
                  } else {
                    userResult({
                      offense: false,
                      trick: selectedTrick,
                      landed: false,
                      score: userScore,
                    });
                    setLandedTrick(false);
                    setSelectedTrick("");
                    setTurns(turns + 1);
                  }
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  trick: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E90FF",
    marginBottom: 12,
  },
  defenseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#1E90FF",
    marginHorizontal: 8,
    alignItems: "center",
  },
  defenseButtonMissed: {
    backgroundColor: "#FF4C4C",
  },
  defenseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingBar: {
    height: 4,
    backgroundColor: "#1E90FF",
    alignSelf: "stretch",
    marginTop: 12,
    borderRadius: 2,
  },
});
