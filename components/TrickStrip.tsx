import { Stance } from "@/constants/trick-options";
import { BotTrickEntry } from "@/utility/pool-builder";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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
const CARD_HEIGHT = 76;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function landRateColor(rate: number): string {
  if (rate >= 0.7) return "#34C759";
  if (rate >= 0.4) return "#FF9500";
  return "#FF3B30";
}

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

function VariantCard({ card }: { card: VariantCard }) {
  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.name} numberOfLines={1}>
        {card.displayName}
      </Text>
      <View style={cardStyles.row}>
        {card.stances.map((stance) => (
          <Text key={stance} style={cardStyles.stanceLabel}>
            {STANCE_ABBREV[stance]}
          </Text>
        ))}
      </View>
      <View style={cardStyles.row}>
        {card.stances.map((stance) => {
          const rate = card.landRates[stance] ?? 0;
          return (
            <Text
              key={stance}
              style={[cardStyles.rateLabel, { color: landRateColor(rate) }]}
            >
              {Math.round(rate * 100)}%
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  name: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stanceLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
});

// ---------------------------------------------------------------------------
// Two-row horizontal strip
// ---------------------------------------------------------------------------

export default function TrickStrip({ pool }: TrickStripProps) {
  const cards = useMemo(() => buildVariantCards(pool), [pool]);
  const [topRow, bottomRow] = useMemo(() => splitIntoRows(cards), [cards]);

  if (cards.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={stripStyles.content}
    >
      <View style={stripStyles.column}>
        {/* Top row */}
        <View style={stripStyles.row}>
          {topRow.map((card, i) => (
            <VariantCard key={i} card={card} />
          ))}
        </View>
        {/* Bottom row */}
        <View style={stripStyles.row}>
          {bottomRow.map((card, i) => (
            <VariantCard key={i} card={card} />
          ))}
        </View>
      </View>
    </ScrollView>
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
});
