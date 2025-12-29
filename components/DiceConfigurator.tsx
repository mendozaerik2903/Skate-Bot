import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const stances = ["Regular", "Nollie", "Fakie", "Switch"];
const trickTypes = ["180s", "360s", "Shove-its", "Flips"];

export default function DiceConfigurator() {
  const [selectedStances, setSelectedStances] = useState<string[]>([]);
  const [selectedTricks, setSelectedTricks] = useState<string[]>([]);

  const toggleItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const renderToggleGroup = (
    title: string,
    items: string[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.buttonRow}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => toggleItem(item, selected, setSelected)}
            style={[
              styles.toggleButton,
              selected.includes(item) && styles.selectedButton,
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selected.includes(item) && styles.selectedButtonText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const rollDice = () => {
    if (selectedStances.length === 0 || selectedTricks.length === 0) {
      Alert.alert("Select at least one stance and one trick type!");
      return;
    }
    const stance =
      selectedStances[Math.floor(Math.random() * selectedStances.length)];
    const trick =
      selectedTricks[Math.floor(Math.random() * selectedTricks.length)];
    Alert.alert("Your Trick", `${stance} ${trick}`);
  };

  return (
    <View style={styles.container}>
      {renderToggleGroup("Stances", stances, selectedStances, setSelectedStances)}
      {renderToggleGroup("Trick Types", trickTypes, selectedTricks, setSelectedTricks)}

      <TouchableOpacity style={styles.rollButton} onPress={rollDice}>
        <Text style={styles.rollButtonText}>Roll Dice</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f2f2f2",
  },
  selectedButton: {
    borderColor: "#1E90FF",
    backgroundColor: "#1E90FF",
  },
  toggleButtonText: {
    color: "#333",
  },
  selectedButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  rollButton: {
    marginTop: 24,
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  rollButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
