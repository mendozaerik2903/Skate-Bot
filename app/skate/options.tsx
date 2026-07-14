import BotCardView from "@/components/BotCardView";
import CustomHeader from "@/components/CustomHeader";
import DifficultySlider from "@/components/DifficultySlider";
import SegmentedControl from "@/components/SegmentedControl";
import TrickStrip from "@/components/TrickStrip";
import { DEFAULT_DIFFICULTY_VALUE } from "@/constants/difficulty";
import { Difficulty } from "@/constants/types";
import {
  BotCard,
  buildCarousel,
  getDefaultNewBotCard,
  reorderBotCards,
  upsertBotCard,
} from "@/utility/bot-builder";
import { BotTrickEntry } from "@/utility/pool-builder";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 12;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 4;

const LETTERS_OPTIONS = ["SK8", "SKATE", "SKATEBOARD"];
const TURN_OPTIONS = ["User First", "Bot First", "Roshambo"] as const;
type TurnOrder = (typeof TURN_OPTIONS)[number];

export default function SkateScreen() {
  const [carousel, setCarousel] = useState<BotCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    DEFAULT_DIFFICULTY_VALUE,
  );
  const [letters, setLetters] = useState("SKATE");
  const [turnOrder, setTurnOrder] = useState<TurnOrder>("Roshambo");

  // Reload on every focus — picks up edits/deletes/reorders made on the
  // bot-edit / trick-pool-editor screens when navigating back.
  useFocusEffect(
    useCallback(() => {
      buildCarousel().then(setCarousel);
    }, []),
  );

  const activeCard = carousel[activeIndex] ?? null;

  // Resolve the trick pool for the active card — difficulty scalar applies
  // to landRate only, for every bot; sampleWeight is never touched.
  const resolvedPool = useMemo<BotTrickEntry[]>(() => {
    if (!activeCard) return [];
    return (activeCard.savedPool ?? []).map((entry) => ({
      ...entry,
      landRate: entry.landRate * difficulty,
    }));
  }, [activeCard, difficulty]);

  // FlatList viewability — update activeIndex as user swipes
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const openBotEdit = (botCardId: string) =>
    router.push({ pathname: "/skate/bot-edit", params: { botCardId } });

  // Create a new bot and go straight to its edit screen
  const handleAddBot = useCallback(async () => {
    const newBot = getDefaultNewBotCard();
    const updated = await upsertBotCard(newBot);
    setCarousel(updated);
    openBotEdit(newBot.id);
  }, []);

  // Persist carousel order after a long-press drag reorder
  const handleDragEnd = useCallback(({ data }: { data: BotCard[] }) => {
    setCarousel(data);
    reorderBotCards(data);
  }, []);

  // Start game
  const handleStart = () => {
    if (!activeCard) return;

    const rawTurnOrder =
      turnOrder === "User First"
        ? "user"
        : turnOrder === "Bot First"
          ? "bot"
          : "roshambo";

    router.push({
      pathname: "/skate/game",
      params: {
        offense: rawTurnOrder,
        difficulty: difficulty,
        letters: letters,
        botCardId: activeCard.id,
      },
    });
  };

  if (carousel.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader
        title="setup"
        showBackButton
        rightIconName="add"
        onRightIconPress={handleAddBot}
      />

      <View style={styles.content}>
        {/* Bot Carousel — long-press a card to drag-reorder */}
        <DraggableFlatList
          data={carousel}
          horizontal
          onDragEnd={handleDragEnd}
          activationDistance={12}
          snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
          autoscrollThreshold={CARD_WIDTH * 0.25}
          autoscrollSpeed={150}
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={true}
          dragItemOverflow={true}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          contentContainerStyle={styles.carouselContent}
          renderItem={({
            item,
            drag,
            isActive: isDragging,
            getIndex,
          }: RenderItemParams<BotCard>) => {
            const index = getIndex() ?? 0;
            return (
              <BotCardView
                card={item}
                isActive={index === activeIndex}
                isDragging={isDragging}
                width={CARD_WIDTH}
                onEdit={() => openBotEdit(item.id)}
                onLongPress={drag}
              />
            );
          }}
          style={styles.carousel}
        />

        {/* Carousel pagination dots */}
        <View style={styles.dotsRow}>
          {carousel.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* ── Inline trick strip ── */}
        {resolvedPool.length > 0 && (
          <View style={styles.stripWrapper}>
            <TrickStrip pool={resolvedPool} />
          </View>
        )}

        {/* ── Difficulty (shown for all bots) ── */}
        <View style={styles.section}>
        <Text style={styles.sectionLabel}>Difficulty</Text>
          <DifficultySlider value={difficulty} onValueChange={setDifficulty} />
        </View>

        {/* ── Match Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Letters</Text>
          <SegmentedControl
            options={LETTERS_OPTIONS}
            selected={letters}
            onSelect={(v: string) => setLetters(v)}
            strict
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Turn Order</Text>
          <SegmentedControl
            options={[...TURN_OPTIONS]}
            selected={turnOrder}
            onSelect={(v: string) => setTurnOrder(v as TurnOrder)}
            strict
          />
        </View>
      </View>

      {/* ── Start Button — fixed above tab bar ── */}
      <View style={styles.startContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !activeCard && styles.startButtonDisabled,
          ]}
          onPress={handleStart}
          disabled={!activeCard}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    gap: 12,
    paddingTop: 8,
  },

  // Carousel
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: CARD_MARGIN,
  },

  // Pagination dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#1E90FF",
    width: 16,
  },

  // Section label
  section: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  // Strip wrapper — no horizontal padding, strip handles its own
  stripWrapper: {
    marginBottom: -4,
  },

  // Start button
  startContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "#f5f5f5",
  },
  startButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#1E90FF",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: "#aaa",
    shadowOpacity: 0,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});