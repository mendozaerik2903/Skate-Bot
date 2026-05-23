import {
  Modifier,
  Rotation,
  Stance,
  TrickComponents,
  trickOptions,
  TrickType,
} from "@/constants/trick-options";
import { AttemptResults } from "@/constants/types";
import { buildTrickName } from "@/utility/trick-manipulator";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FilterButtons from "./FilterButtons";
import SegmentedControl from "./SegmentedControl";
import TrickResponse from "./TrickResponse";

interface TrickBuilderProps {
  turnSuccess: (result: AttemptResults) => void;
  exhaustedTricks: string[];
}

const typeMap: Record<string, TrickType> = {
  shuvits: "shuvit",
  flips: "flip",
  heels: "heel",
  others: "other",
};

const TrickItem = React.memo(
  ({
    item,
    isSelected,
    onPress,
  }: {
    item: { value: string; label: string };
    isSelected: boolean;
    onPress: (value: string) => void;
  }) => (
    <Pressable
      onPress={() => onPress(item.value)}
      style={[styles.item, isSelected && styles.selectedItem]}
    >
      <Text style={[styles.itemText, isSelected && styles.selectedText]}>
        {item.label}
      </Text>
    </Pressable>
  ),
);

export default function TrickBuilder({
  turnSuccess,
  exhaustedTricks,
}: TrickBuilderProps) {
  const trickTypes = ["shuvits", "flips", "heels"];
  const [selectedType, setSelectedType] = useState<string[]>([]);

  const [stance, setStance] = useState<Stance>("regular");
  const [rotation, setRotation] = useState<Rotation>("");
  const [modifier, setModifier] = useState<Modifier>("");
  const [trick, setTrick] = useState("Ollie");
  const [trickObj, setTrickObj] = useState<TrickComponents>({
    stance: stance,
    rotation: rotation,
    modifier: modifier,
    trick: trick,
  });

  const selectedTrickObj = trickOptions.find((t) => t.value === trick);
  const validModifiers = selectedTrickObj?.modifiers ?? [];

  const filteredTrickOptions = trickOptions.filter((option) => {
    if (selectedType.length === 0) return true;
    return selectedType.some((type) =>
      option.type.includes(typeMap[type] as TrickType),
    );
  });

  const handleTrickSelect = useCallback((value: string) => {
    setTrick(value);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: { value: string; label: string } }) => (
      <TrickItem
        item={item}
        isSelected={trick === item.value}
        onPress={handleTrickSelect}
      />
    ),
    [trick, handleTrickSelect],
  );

  const keyExtractor = useCallback((item: { value: string }) => item.value, []);

  useEffect(() => {
    if (!(validModifiers as String[]).includes(modifier)) {
      setModifier("");
    }
    if (
      selectedTrickObj?.rotations.includes("BS") ||
      selectedTrickObj?.rotations.includes("FS")
    ) {
      setRotation(selectedTrickObj?.rotations[0]);
    } else {
      setRotation("");
    }
  }, [trick]);

  const finalTrick = buildTrickName({ stance, rotation, trick, modifier });
  const isExhausted = exhaustedTricks.includes(finalTrick);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You're attempting:</Text>
      <Text style={styles.trick}>{finalTrick}</Text>
      <View style={{ marginBottom: 10 }}>
        <TrickResponse
          landedDisabled={isExhausted}
          onLanded={() => {
            turnSuccess({
              offense: true,
              trick: finalTrick,
              trickComponents: { stance, rotation, trick, modifier },
              landed: true,
            });
          }}
          onMissed={() => {
            turnSuccess({ offense: true, landed: false });
          }}
        />
      </View>

      {/* Row 1: Stance */}
      <SegmentedControl
        options={["regular", "fakie", "nollie", "switch"]}
        selected={stance}
        onSelect={(value) => setStance(value as Stance)}
        strict
      />

      {/* Row 2: rotation */}
      <SegmentedControl
        options={selectedTrickObj?.rotations ?? []}
        selected={rotation}
        onSelect={(value) => setRotation(value as Rotation)}
        strict={
          (selectedTrickObj?.rotations.includes("BS") ||
            selectedTrickObj?.rotations.includes("FS")) ??
          false
        }
      />

      {/* Row 3: main trick */}
      <FilterButtons
        options={trickTypes}
        selected={selectedType}
        onSelect={setSelectedType}
      />
      <FlatList
        data={filteredTrickOptions}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        style={styles.picker}
        renderItem={renderItem}
      />

      {/* Row 4: Modifier */}
      {validModifiers.length > 0 && (
        <SegmentedControl
          options={validModifiers}
          selected={modifier}
          onSelect={(value) => setModifier(value as Modifier)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    paddingInline: 10,
    backgroundColor: "#FFF",
  },
  pickerGroup: {
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    marginTop: 0,
  },
  text: {
    fontSize: 18,
    marginBottom: 0,
    textAlign: "center",
  },
  trick: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E90FF",
    marginBottom: 0,
  },
  picker: {
    flex: 1,
    height: 200,
    width: "100%",
    color: "black",
    overflow: "hidden",
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  selectedItem: {
    backgroundColor: "#007AFF20",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
