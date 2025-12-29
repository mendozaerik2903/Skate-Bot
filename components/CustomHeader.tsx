import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // or useNavigation for React Navigation
import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: (event: GestureResponderEvent) => void;
};

export default function CustomHeader({
  title,
  showBackButton = false,
  rightIconName,
  onRightIconPress,
}: CustomHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.headerContainer}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} style={styles.sideButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}

      <Text style={styles.headerText}>{title}</Text>

      {rightIconName ? (
        <TouchableOpacity onPress={onRightIconPress} style={styles.sideButton}>
          <Ionicons name={rightIconName} size={24} color="#fff" />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#1E90FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  sideButton: {
    width: 40,
    alignItems: "center",
  },
});
