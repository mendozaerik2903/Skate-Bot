import { landRateScaleColor } from "@/constants/difficulty";
import { Stance } from "@/constants/trick-options";
import { BotTrickEntry } from "@/utility/pool-builder";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrickStripProps = {
  pool: BotTrickEntry[];
};

type VariantCard = {
  displayName: string;
  stances: Stance[];
  landRates: Partial<Record<Stance, number>>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STANCE_ABBREV: Record<Stance, string> = {
  regular: "reg",
  fakie: "fak",
  nollie: "nol",
  switch: "swi",
};

const STANCE_ORDER: Stance[] = ["regular", "fakie", "nollie", "switch"];

const CARD_WIDTH = 140;
const CARD_HEIGHT = 62;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// landRateColor moved to constants/difficulty.ts as landRateScaleColor —
// kept the import name distinct so call sites below read clearly.

function buildVariantCards(pool: BotTrickEntry[]): VariantCard[] {
  const map = new Map<
    string,
    {
      displayName: string;
      landRates: Partial<Record<Stance, number>>;
    }
  >();

  for (const entry of pool) {
    const key = `${entry.trick}|${entry.rotation}`;
    if (!map.has(key)) {
      map.set(key, { displayName: entry.fullString, landRates: {} });
    }
    const card = map.get(key)!;
    if (entry.stance === "regular") {
      card.displayName = entry.fullString;
    }
    card.landRates[entry.stance] = entry.landRate;
  }

  return Array.from(map.values()).map(({ displayName, landRates }) => ({
    displayName,
    stances: STANCE_ORDER.filter((s) => landRates[s] !== undefined),
    landRates,
  }));
}

// Split cards into two rows, alternating — card 0 → row 0, card 1 → row 1,
// card 2 → row 0, card 3 → row 1, etc. This fills both rows in column order
// as the user scrolls right, which feels natural.
function splitIntoRows(cards: VariantCard[]): [VariantCard[], VariantCard[]] {
  const top: VariantCard[] = [];
  const bottom: VariantCard[] = [];
  cards.forEach((card, i) => {
    if (i % 2 === 0) top.push(card);
    else bottom.push(card);
  });
  return [top, bottom];
}

// ---------------------------------------------------------------------------
// Single variant card
// ---------------------------------------------------------------------------

function VariantCard({
  card,
  showPercentages,
  onPress,
}: {
  card: VariantCard;
  showPercentages: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.container,
        pressed && cardStyles.containerPressed,
      ]}
      onPress={onPress}
    >
      <Text style={cardStyles.name} numberOfLines={1}>
        {card.displayName}
      </Text>
      <View style={cardStyles.row}>
        {card.stances.map((stance) => {
          const rate = card.landRates[stance] ?? 0;
          return (
            <View key={stance} style={cardStyles.stanceColumn}>
              <View
                style={[
                  cardStyles.stanceChip,
                  { backgroundColor: landRateScaleColor(rate) },
                ]}
              >
                <Text style={cardStyles.stanceChipText}>
                  {STANCE_ABBREV[stance]}
                </Text>
              </View>
              <Text
                style={[
                  cardStyles.stancePercent,
                  { color: landRateScaleColor(rate) },
                  !showPercentages && cardStyles.stancePercentHidden,
                ]}
              >
                {Math.round(rate * 100)}%
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 16, // always the "expanded" height now
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 4,
    justifyContent: "space-between",
  },
  containerPressed: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  stanceColumn: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  stanceChip: {
    width: "100%",
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  stanceChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  stancePercent: {
    fontSize: 9,
    fontWeight: "700",
  },
  stancePercentHidden: {
    opacity: 0,
  },
});

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function TrickDetailModal({
  card,
  onClose,
}: {
  card: VariantCard | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={card !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        {card && (
          <Pressable style={modalStyles.sheet} onPress={() => {}}>
            <Text style={modalStyles.name}>{card.displayName}</Text>
            <View style={modalStyles.ratesList}>
              {card.stances.map((stance) => {
                const rate = card.landRates[stance] ?? 0;
                return (
                  <View key={stance} style={modalStyles.rateRow}>
                    <Text style={modalStyles.stanceName}>
                      {STANCE_ABBREV[stance]}
                    </Text>
                    <Text
                      style={[
                        modalStyles.rateValue,
                        { color: landRateScaleColor(rate) },
                      ]}
                    >
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
    textAlign: "center",
  },
  ratesList: {
    gap: 10,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stanceName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  rateValue: {
    fontSize: 16,
    fontWeight: "800",
  },
});

// ---------------------------------------------------------------------------
// Two-row horizontal strip
// ---------------------------------------------------------------------------

export default function TrickStrip({ pool }: TrickStripProps) {
  const cards = useMemo(() => buildVariantCards(pool), [pool]);
  const [topRow, bottomRow] = useMemo(() => splitIntoRows(cards), [cards]);
  const [selectedCard, setSelectedCard] = useState<VariantCard | null>(null);
  const [showPercentages, setShowPercentages] = useState(false);

  if (cards.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stripStyles.content}
      >
        <View style={stripStyles.column}>
          {/* Top row */}
          <View style={stripStyles.row}>
            {topRow.map((card, i) => (
              <VariantCard
                key={i}
                card={card}
                showPercentages={showPercentages}
                onPress={() => setSelectedCard(card)}
              />
            ))}
          </View>
          {/* Bottom row */}
          <View style={stripStyles.row}>
            {bottomRow.map((card, i) => (
              <VariantCard
                key={i}
                card={card}
                showPercentages={showPercentages}
                onPress={() => setSelectedCard(card)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <Pressable
        style={stripStyles.toggle}
        onPress={() => setShowPercentages((v) => !v)}
      >
        <Text style={stripStyles.toggleText}>
          {showPercentages ? "Less info" : "More info"}
        </Text>
      </Pressable>

      <TrickDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}

const stripStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  column: {
    flexDirection: "column",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  toggle: {
    alignSelf: "flex-end",
    marginRight: 16,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#444",
  },
});