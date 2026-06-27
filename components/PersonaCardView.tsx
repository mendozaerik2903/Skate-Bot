import { BotCard, CustomCard, PersonaCard } from "@/utility/bot-builder";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PersonaCardViewProps {
  card: BotCard;
  isActive: boolean;
  width: number;
}

export default function PersonaCardView({
  card,
  isActive,
  width,
}: PersonaCardViewProps) {
  const isCustom = card.type === "custom";

  return (
    <View style={[styles.card, { width }, isActive && styles.activeCard]}>
      <View style={styles.avatarRow}>
        <View style={[styles.avatar, isCustom && styles.customAvatar]}>
          <Text style={styles.avatarEmoji}>{isCustom ? "🛹" : "🤖"}</Text>
        </View>
        {isCustom && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.description}>
        {isCustom
          ? (card as CustomCard).savedPool
            ? `${(card as CustomCard).savedPool!.length} variants configured`
            : "Tap trick pool to configure"
          : (card as PersonaCard).styleDescription}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: undefined, // depends on screen
    marginHorizontal: 12,
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
