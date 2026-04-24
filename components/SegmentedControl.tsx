// components/SegmentedControl.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  strict?: boolean;
};

export default function SegmentedControl({
  options,
  selected,
  onSelect,
  strict,
}: Props) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segment,
            selected === option && styles.selectedSegment,
          ]}
          onPress={() => {
            if (strict) {
              onSelect(option);
            } else {
              if (selected === option) {
                onSelect("");
              } else {
                onSelect(option);
              }
            }
          }}
        >
          <Text
            style={[styles.text, selected === option && styles.selectedText]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  selectedSegment: {
    backgroundColor: "#1E90FF",
  },
  text: {
    color: "#333",
    fontWeight: "500",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },
});
