import CustomHeader from "@/components/CustomHeader";
import CustomPoolEditor from "@/components/CustomPoolEditor";
import DifficultySlider from "@/components/DifficultySlider";
import PersonaCardView from "@/components/PersonaCardView";
import SegmentedControl from "@/components/SegmentedControl";
import TrickPoolSheet from "@/components/TrickPoolSheet";
import TrickStrip from "@/components/TrickStrip";
import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { DEFAULT_DIFFICULTY_VALUE } from "@/constants/difficulty";
import { Difficulty } from "@/constants/types";
import {
  BotCard,
  CustomCard,
  buildCarousel,
  upsertCustomCard,
} from "@/utility/bot-builder";
import { BotTrickEntry } from "@/utility/pool-builder";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);

  // Load carousel on mount
  useEffect(() => {
    buildCarousel().then(setCarousel);
  }, []);

  const activeCard = carousel[activeIndex] ?? null;
  const isCustomActive = activeCard?.type === "custom";

  // Resolve the trick pool for the active card
  const resolvedPool = useMemo<BotTrickEntry[]>(() => {
    if (!activeCard) return [];

    if (activeCard.type === "custom") {
      // Custom pool: difficulty slider acts as a live preview multiplier on
      // top of the user's saved per-stance landRates. This is intentionally
      // non-destructive — CustomPoolEditor always saves/loads the unscaled
      // baseline, so readjusting the slider later never compounds or loses
      // the original authored values.
      return (activeCard.savedPool ?? []).map((entry) => {
        const scaledLandRate = entry.landRate * difficulty;
        return {
          ...entry,
          landRate: scaledLandRate,
          sampleWeight: entry.sampleWeight ?? scaledLandRate,
        };
      });
    }

    // Persona: poolFilter returns BotTrickEntry[] with sampleWeight already set.
    // Apply difficulty scalar to landRate only — sampleWeight stays boosted.
    const pool = activeCard.poolFilter(MASTER_BOT_TRICKS);
    return pool.map((entry) => ({
      ...entry,
      landRate: entry.landRate * difficulty,
    }));
  }, [activeCard, difficulty]);

  // Unique base trick count for the button row label
  const baseTrickCount = useMemo(() => {
    const names = new Set(resolvedPool.map((e) => e.trick));
    return names.size;
  }, [resolvedPool]);

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

  const openSheet = () => {
    if (isCustomActive) {
      setEditorVisible(true);
    } else {
      setSheetVisible(true);
    }
  };

  // Save custom pool back to AsyncStorage and update carousel state
  const handleSaveCustomPool = useCallback(
    async (updatedPool: BotTrickEntry[]) => {
      if (!activeCard || activeCard.type !== "custom") return;
      const updatedCard: CustomCard = {
        ...activeCard,
        savedPool: updatedPool,
      };
      await upsertCustomCard(updatedCard);
      // Update in-memory carousel so UI reflects saved state immediately
      setCarousel((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
      );
    },
    [activeCard],
  );

  // Start game — all three turn order paths navigate to /classic/game
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
        botCardType: activeCard.type,
      },
    });
  };

  if (carousel.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader title="skate" showBackButton />

      <View style={styles.content}>
        {/* Bot Persona Carousel */}
        <FlatList
          data={carousel}
          horizontal
          pagingEnabled={false}
          snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item, index }) => (
            <PersonaCardView
              card={item}
              isActive={index === activeIndex}
              width={CARD_WIDTH}
            />
          )}
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

        {/* ── Trick pool button row ── */}
        <TouchableOpacity
          style={styles.poolRow}
          onPress={openSheet}
          activeOpacity={0.7}
        >
          <Text style={styles.poolRowLabel}>
            {isCustomActive ? "Edit Trick Pool" : "Preview Trick Pool"}
          </Text>
          <Text style={styles.poolRowMeta}>
            {baseTrickCount} trick{baseTrickCount !== 1 ? "s" : ""}
            {"  ›"}
          </Text>
        </TouchableOpacity>

        {/* ── Difficulty (shown for all card types, custom included) ── */}
        <View style={styles.section}>
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
          <Text style={styles.startButtonText}>⚡ BATTLE BOT</Text>
        </TouchableOpacity>
      </View>

      {/* ── Trick Pool Sheet (persona cards) ── */}
      {activeCard && activeCard.type === "persona" && (
        <TrickPoolSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          activeCard={activeCard}
          difficulty={difficulty}
          pool={resolvedPool}
        />
      )}

      {/* ── Custom Pool Editor (custom cards) ── */}
      {activeCard && activeCard.type === "custom" && (
        <CustomPoolEditor
          visible={editorVisible}
          onClose={() => setEditorVisible(false)}
          activeCard={activeCard}
          onSave={handleSaveCustomPool}
        />
      )}
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

  // Pool button row
  poolRow: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  poolRowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  poolRowMeta: {
    fontSize: 14,
    color: "#1E90FF",
    fontWeight: "600",
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
