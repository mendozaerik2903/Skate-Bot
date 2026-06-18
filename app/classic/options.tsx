import CustomHeader from "@/components/CustomHeader";
import CustomPoolEditor from "@/components/CustomPoolEditor";
import SegmentedControl from "@/components/SegmentedControl";
import TrickPoolSheet from "@/components/TrickPoolSheet";
import TrickStrip from "@/components/TrickStrip";
import { DIFFICULTY_SCALARS, MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 12;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 4;

const LETTERS_OPTIONS = ["SK8", "SKATE", "SKATEBOARD"];
const TURN_OPTIONS = ["User First", "Bot First", "Roshambo"] as const;
type TurnOrder = (typeof TURN_OPTIONS)[number];

const DIFFICULTY_OPTIONS: Difficulty[] = ["Easy", "Medium", "Hard"];

// ---------------------------------------------------------------------------
// Persona card component
// ---------------------------------------------------------------------------

function PersonaCardView({
  card,
  isActive,
}: {
  card: BotCard;
  isActive: boolean;
}) {
  const isCustom = card.type === "custom";

  return (
    <View style={[cardStyles.card, isActive && cardStyles.activeCard]}>
      <View style={cardStyles.avatarRow}>
        <View style={[cardStyles.avatar, isCustom && cardStyles.customAvatar]}>
          <Text style={cardStyles.avatarEmoji}>{isCustom ? "🛹" : "🤖"}</Text>
        </View>
        {isCustom && (
          <View style={cardStyles.customBadge}>
            <Text style={cardStyles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>
      <Text style={cardStyles.name}>{card.name}</Text>
      <Text style={cardStyles.description}>
        {isCustom
          ? (card as CustomCard).savedPool
            ? `${(card as CustomCard).savedPool!.length} variants configured`
            : "Tap trick pool to configure"
          : (card as any).styleDescription}
      </Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeCard: {
    borderColor: "#1E90FF",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  customAvatar: {
    backgroundColor: "#e8f0fe",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  customBadge: {
    backgroundColor: "#1E90FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SkateScreen() {
  const [carousel, setCarousel] = useState<BotCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [letters, setLetters] = useState("SKATE");
  const [turnOrder, setTurnOrder] = useState<TurnOrder>("Roshambo");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const flatListRef = useRef<FlatList<BotCard>>(null);

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
      // Custom pool: sampleWeight matches landRate for display
      return (activeCard.savedPool ?? []).map((entry) => ({
        ...entry,
        sampleWeight: entry.sampleWeight ?? entry.landRate,
      }));
    }

    // Persona: poolFilter returns BotTrickEntry[] with sampleWeight already set.
    // Apply difficulty scalar to landRate only — sampleWeight stays boosted.
    const pool = activeCard.poolFilter(MASTER_BOT_TRICKS);
    const scalar = DIFFICULTY_SCALARS[difficulty];
    return pool.map((entry) => ({
      ...entry,
      landRate: entry.landRate * scalar,
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

    // Strip dots from letters for game params (S.K.A.T.E -> SKATE)
    const scoreWord = letters.replace(/\./g, "");

    router.push({
      pathname: "/classic/game",
      params: {
        offense: rawTurnOrder,
        difficulty: isCustomActive ? "Custom" : difficulty,
        letters: scoreWord,
        botCardId: activeCard.id,
        botCardType: activeCard.type,
      },
    });
  };

  if (carousel.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader title="skate" />

      <View style={styles.content}>
        {/* ── Bot Persona Carousel ── */}
        <FlatList
          ref={flatListRef}
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
            <PersonaCardView card={item} isActive={index === activeIndex} />
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
          onPress={() => openSheet()}
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

        {/* ── Difficulty (hidden for custom card) ── */}
        {!isCustomActive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Difficulty</Text>
            <SegmentedControl
              options={DIFFICULTY_OPTIONS}
              selected={difficulty}
              onSelect={(v: string) => setDifficulty(v as Difficulty)}
              strict
            />
          </View>
        )}

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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
