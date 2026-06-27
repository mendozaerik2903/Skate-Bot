import {
    DEFAULT_DIFFICULTY_VALUE,
    DIFFICULTY_MARKERS,
    DIFFICULTY_MAX,
    DIFFICULTY_MIN,
    difficultyScaleColor,
    nearestDifficultyLabel,
} from "@/constants/difficulty";
import { DifficultyLabel } from "@/constants/types";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export type DifficultySliderProps = {
  value: number;
  onValueChange: (value: number) => void;
};

const LABEL_ORDER: DifficultyLabel[] = ["Easy", "Medium", "Hard"];

export default function DifficultySlider({
  value,
  onValueChange,
}: DifficultySliderProps) {
  // Tracks whether the user is actively dragging, so the "leaning X" hint
  // only shows while interacting rather than persisting at rest.
  const [dragging, setDragging] = useState(false);

  const color = difficultyScaleColor(value);
  const hintLabel = nearestDifficultyLabel(value);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Difficulty</Text>
        <Text style={[styles.hint, { color }]}>
          {dragging ? `leaning ${hintLabel}` : hintLabel}
        </Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={DIFFICULTY_MIN}
        maximumValue={DIFFICULTY_MAX}
        step={0.01}
        value={value}
        onValueChange={onValueChange}
        onSlidingStart={() => setDragging(true)}
        onSlidingComplete={() => setDragging(false)}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#e0e0e0"
        thumbTintColor={color}
      />

      {/* Marker row — each label sits at its actual value's position along
          the track (50%, 75%, 100%), not evenly spaced, since the markers
          themselves aren't evenly spaced in [0,1]. */}
      <View style={styles.markerRow}>
        {LABEL_ORDER.map((label) => {
          const pct = DIFFICULTY_MARKERS[label] * 100;
          return (
            <Text
              key={label}
              style={[
                styles.markerLabel,
                {
                  position: "absolute",
                  left: `${pct}%`,
                  transform: [{ translateX: -14 }],
                },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export { DEFAULT_DIFFICULTY_VALUE, DIFFICULTY_MARKERS };

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  hint: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  slider: {
    height: 36,
    marginHorizontal: -8,
  },
  markerRow: {
    position: "relative",
    height: 16,
    marginTop: -2,
  },
  markerLabel: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "500",
  },
});
