import CustomHeader from "@/components/CustomHeader";
import { GameSummary, useGameHistory } from "@/hooks/useGameHistory";
import { useGameStats } from "@/hooks/useGameStats";
import { clearGuestData, isGuestMode } from "@/utility/guest-mode";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  const { stats, isLoading: statsLoading } = useGameStats();
  const { games, isLoading: gamesLoading } = useGameHistory();

  const isLoading = statsLoading || gamesLoading;
  const hasPlayedGames = stats?.hasPlayedGames ?? false;

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top"]}>
      
      <CustomHeader title="skate" />

      {isLoading ? (
        <View style={styles.container} />
      ) : !hasPlayedGames ? (
        <OnboardingState />
      ) : (
        <SkateTabContent stats={stats!} games={games} />
      )}
    </SafeAreaView>
  );
}

function SkateTabContent({
  stats,
  games,
}: {
  stats: NonNullable<ReturnType<typeof useGameStats>["stats"]>;
  games: GameSummary[];
}) {
  const [mostRecentGame, ...restOfGames] = games;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <StatsStrip stats={stats} />
      <StartGameButton />

      {mostRecentGame && (
        <>
          <Text style={styles.sectionLabel}>Recent match</Text>
          <RecentMatchCard game={mostRecentGame} />
        </>
      )}

      {restOfGames.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Match history</Text>
          {restOfGames.map((game) => (
            <MatchHistoryRow key={game.id} game={game} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function OnboardingState() {
  return (
    <View style={styles.container}>
      <Text style={styles.onboardingTagline}>
        Play your first game of SKATE to start building your match history.
      </Text>
      <StartGameButton />
    </View>
  );
}

function StartGameButton() {
  return (
    <Pressable
      style={styles.startButton}
      onPress={() =>
        router.push({
          pathname: "/skate/options",
          params: {},
        })
      }
    >
      <Text style={styles.startButtonText}>Start new game</Text>
    </Pressable>
  );
}

function StatsStrip({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useGameStats>["stats"]>;
}) {
  const streakLabel =
    stats.currentStreak.type && stats.currentStreak.count > 1
      ? `${stats.currentStreak.type}${stats.currentStreak.count} streak`
      : null;

  return (
    <View style={styles.statsCard}>
      <View style={styles.recordRow}>
        <Text style={styles.recordText}>
          {stats.wins}–{stats.losses}
        </Text>
        {streakLabel && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{streakLabel}</Text>
          </View>
        )}
      </View>

      {stats.mostLandedTrick && (
        <Text style={styles.mostLandedText}>
          Most landed: {stats.mostLandedTrick}
        </Text>
      )}

      <View style={styles.sparklineRow}>
        <Text style={styles.sparklineLabel}>Recent 5</Text>
        {stats.last5.map((won, index) => (
          <View
            key={index}
            style={[
              styles.sparklineDot,
              won ? styles.sparklineDotWin : styles.sparklineDotLoss,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function RecentMatchCard({ game }: { game: GameSummary }) {
  return (
    <Pressable
      style={styles.recentMatchCard}
      onPress={() => router.push(`/games/${game.id}/history`)}
    >
      <View style={styles.recentMatchInfo}>
        <Text style={styles.recentMatchName}>{game.bot_persona}</Text>
        <Text style={styles.recentMatchDate}>
          {formatRelativeDate(game.created_at)}
        </Text>
      </View>
      <View
        style={[
          styles.outcomeBadge,
          game.won ? styles.outcomeBadgeWin : styles.outcomeBadgeLoss,
        ]}
      >
        <Text style={styles.outcomeBadgeText}>{game.won ? "Win" : "Loss"}</Text>
      </View>
    </Pressable>
  );
}

function MatchHistoryRow({ game }: { game: GameSummary }) {
  return (
    <Pressable
      style={styles.historyRow}
      onPress={() => router.push(`/games/${game.id}/history`)}
    >
      <View style={styles.historyRowInfo}>
        <Text style={styles.historyRowName}>{game.bot_persona}</Text>
        <Text style={styles.historyRowDate}>
          {formatRelativeDate(game.created_at)}
        </Text>
      </View>
      <Text
        style={[
          styles.historyRowOutcome,
          game.won ? styles.textWin : styles.textLoss,
        ]}
      >
        {game.won ? "Win" : "Loss"}
      </Text>
    </Pressable>
  );
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  onboardingTagline: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 48,
  },
  startButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  recordText: {
    fontSize: 28,
    fontWeight: "600",
  },
  streakBadge: {
    backgroundColor: "#EAF3DE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B6D11",
  },
  mostLandedText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  sparklineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sparklineLabel: {
    fontSize: 12,
    color: "#888",
    marginRight: 4,
  },
  sparklineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sparklineDotWin: {
    backgroundColor: "#639922",
  },
  sparklineDotLoss: {
    backgroundColor: "#CCCCCC",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  recentMatchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentMatchInfo: {
    flex: 1,
  },
  recentMatchName: {
    fontSize: 15,
    fontWeight: "600",
  },
  recentMatchDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  outcomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outcomeBadgeWin: {
    backgroundColor: "#EAF3DE",
  },
  outcomeBadgeLoss: {
    backgroundColor: "#FCEBEB",
  },
  outcomeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  historyRowInfo: {
    flex: 1,
  },
  historyRowName: {
    fontSize: 14,
  },
  historyRowDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  historyRowOutcome: {
    fontSize: 13,
    fontWeight: "600",
  },
  textWin: {
    color: "#3B6D11",
  },
  textLoss: {
    color: "#A32D2D",
  },
});