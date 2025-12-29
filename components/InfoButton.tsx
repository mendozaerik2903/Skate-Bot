import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface InfoButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  style?: object;
}

export default function InfoButton({
  onPress,
  size = 24,
  color = "black",
  style = {},
}: InfoButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <FontAwesome5 name="question-circle" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
});
