import { BotCard } from "@/utility/bot-builder";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BotCardViewProps {
  card: BotCard;
  isActive: boolean;
  isDragging?: boolean;
  width: number;
  onEdit: () => void;
  onLongPress: () => void;
}

export default function BotCardView({
  card,
  isActive,
  isDragging,
  width,
  onEdit,
  onLongPress,
}: BotCardViewProps) {
  const trickCount = card.savedPool?.length ?? 0;
  const isUnconfigured = !card.savedPool || card.savedPool.length === 0;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={250}
      style={[
        styles.card,
        { width },
        isActive && styles.activeCard,
        isDragging && styles.draggingCard,
      ]}
    >
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEdit}
        hitSlop={10}
      >
        <Ionicons name="pencil" size={16} color="#1E90FF" />
      </TouchableOpacity>

      <View style={styles.contentRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{card.avatarEmoji}</Text>
        </View>
        <View style={styles.textColumn}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{card.name}</Text>
          </View>
          <Text style={styles.description}>
            {isUnconfigured
              ? "Tap trick pool to configure"
              : card.description ||
                `${trickCount} variant${trickCount !== 1 ? "s" : ""} configured`}
          </Text>
        </View>
      </View>
    </Pressable>
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
  draggingCard: {
    opacity: 0.85,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  editButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 26,
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
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  textColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});