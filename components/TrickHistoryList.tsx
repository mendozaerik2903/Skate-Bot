import { TrickHistoryEntry } from "@/constants/types";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface TrickHistoryListProps {
  history: TrickHistoryEntry[];
  username?: string;
  scoreWord: string;
}

export default function TrickHistoryList({
  history,
  username = "You",
  scoreWord,
}: TrickHistoryListProps) {
  const reversed = [...history].reverse();

  const getPerformerLabel = (performer: "user" | "bot") =>
    performer === "user" ? username : "Bot";

  const getScoreDisplay = (score: number) =>
    scoreWord.substring(0, score).toUpperCase();

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tricks yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reversed}
      keyExtractor={(_, index) => index.toString()}
      nestedScrollEnabled
      renderItem={({ item, index }) => {
        const performer = getPerformerLabel(item.performer);
        const action = item.landed ? "landed" : "missed";
        const side = item.offense ? "offense" : "defense";
        const scoreDisplay = getScoreDisplay(item.performerScore);
        const isUser = item.performer === "user";

        return (
          <View
            style={[
              styles.row,
              index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            ]}
          >
            {/* Turn number */}
            <Text style={styles.turnNumber}>#{item.turn}</Text>

            {/* Sentence */}
            <View style={styles.sentenceContainer}>
              <Text style={styles.sentence}>
                <Text
                  style={[
                    styles.performer,
                    isUser ? styles.userColor : styles.botColor,
                  ]}
                >
                  {performer}
                </Text>
                {` `}
                <Text style={styles.action}>{action}</Text>
                {` `}
                <Text style={styles.trickName}>{item.trick}</Text>
                <Text style={styles.action}>{` on ${side}.`}</Text>
              </Text>
            </View>

            {/* Score badge */}
            <View
              style={[
                styles.scoreBadge,
                scoreDisplay ? styles.scoreBadgeFilled : styles.scoreBadgeEmpty,
              ]}
            >
              <Text style={styles.scoreText}>{scoreDisplay || "—"}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    gap: 8,
  },
  rowEven: {
    backgroundColor: "#f5f8ff",
  },
  rowOdd: {
    backgroundColor: "#ffffff",
  },
  turnNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
    width: 28,
    textAlign: "right",
  },
  sentenceContainer: {
    flex: 1,
  },
  sentence: {
    fontSize: 14,
    lineHeight: 20,
  },
  performer: {
    fontWeight: "700",
    fontSize: 14,
  },
  userColor: {
    color: "#1E90FF",
  },
  botColor: {
    color: "#FF6B35",
  },
  action: {
    color: "#444",
    fontWeight: "400",
    fontSize: 14,
  },
  trickName: {
    fontWeight: "600",
    color: "#222",
    fontSize: 14,
  },
  scoreBadge: {
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeFilled: {
    backgroundColor: "#1E90FF",
  },
  scoreBadgeEmpty: {
    backgroundColor: "#e0e0e0",
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: 14,
  },
});
