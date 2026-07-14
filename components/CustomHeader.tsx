import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { GestureResponderEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: (event: GestureResponderEvent) => void;
};

const INK = "#1C1C1E";
const HAIRLINE = "#E5E5EA";

export default function CustomHeader({
  title,
  showBackButton = false,
  rightIconName,
  onRightIconPress,
}: CustomHeaderProps) {
  const router = useRouter();
  const handleBack = () => router.back();

  return (
    <View style={styles.headerContainer}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} style={styles.sideButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}

      <Text style={styles.headerText} numberOfLines={1}>
        {title}
      </Text>

      {rightIconName ? (
        <TouchableOpacity onPress={onRightIconPress} style={styles.sideButton} hitSlop={8}>
          <Ionicons name={rightIconName} size={22} color={INK} />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerText: {
    fontSize: 17,
    fontWeight: "600",
    color: INK,
    textAlign: "center",
    flex: 1,
  },
  sideButton: {
    width: 40,
    alignItems: "center",
  },
});