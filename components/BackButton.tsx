import { useRouter } from "expo-router"; // or useNavigation from React Navigation
import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type BackButtonProps = {
  label?: string;
  style?: ViewStyle;
};

export default function BackButton({ label = "Back", style }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    router.back(); // For React Navigation, use navigation.goBack()
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <Text style={styles.buttonText}>← {label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#eee",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
});
