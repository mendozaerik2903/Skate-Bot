import CustomHeader from "@/components/CustomHeader";
import SegmentedControl from "@/components/SegmentedControl";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Modifier = {
  id: string;
  label: string;
  enabled: boolean;
  landRate: number; // 0–100
};

type BaseTrick = {
  id: string;
  label: string;
  enabled: boolean;
  landRate: number;
  expanded: boolean;
  modifiers: Modifier[];
};

type StanceGroup = {
  id: string;
  label: string;
  enabled: boolean;
  expanded: boolean;
  tricks: BaseTrick[];
};

// ---------------------------------------------------------------------------
// Seed data — swap this out for a GET /api/tricks/combinations fetch later
// ---------------------------------------------------------------------------

const INITIAL_STANCES: StanceGroup[] = [
  {
    id: "normal",
    label: "Normal",
    enabled: true,
    expanded: false,
    tricks: [
      {
        id: "normal-ollie",
        label: "Ollie",
        enabled: true,
        landRate: 90,
        expanded: false,
        modifiers: [
          {
            id: "normal-ollie-fs180",
            label: "Frontside 180",
            enabled: true,
            landRate: 70,
          },
          {
            id: "normal-ollie-bs180",
            label: "Backside 180",
            enabled: true,
            landRate: 65,
          },
        ],
      },
      {
        id: "normal-kickflip",
        label: "Kickflip",
        enabled: true,
        landRate: 75,
        expanded: false,
        modifiers: [
          {
            id: "normal-kickflip-bs180",
            label: "Backside 180 Kickflip",
            enabled: true,
            landRate: 45,
          },
          {
            id: "normal-kickflip-fs180",
            label: "Frontside 180 Kickflip",
            enabled: true,
            landRate: 40,
          },
        ],
      },
      {
        id: "normal-heelflip",
        label: "Heelflip",
        enabled: true,
        landRate: 70,
        expanded: false,
        modifiers: [
          {
            id: "normal-heelflip-bs180",
            label: "Backside 180 Heelflip",
            enabled: true,
            landRate: 40,
          },
        ],
      },
      {
        id: "normal-shuvit",
        label: "Shuvit",
        enabled: true,
        landRate: 80,
        expanded: false,
        modifiers: [
          {
            id: "normal-shuvit-360",
            label: "360 Shuvit",
            enabled: true,
            landRate: 60,
          },
          {
            id: "normal-shuvit-revert",
            label: "Shuvit Revert",
            enabled: true,
            landRate: 55,
          },
        ],
      },
    ],
  },
  {
    id: "fakie",
    label: "Fakie",
    enabled: true,
    expanded: false,
    tricks: [
      {
        id: "fakie-ollie",
        label: "Ollie",
        enabled: true,
        landRate: 85,
        expanded: false,
        modifiers: [
          {
            id: "fakie-ollie-fs180",
            label: "Frontside 180",
            enabled: true,
            landRate: 65,
          },
        ],
      },
      {
        id: "fakie-kickflip",
        label: "Kickflip",
        enabled: true,
        landRate: 65,
        expanded: false,
        modifiers: [],
      },
      {
        id: "fakie-shuvit",
        label: "Shuvit",
        enabled: true,
        landRate: 75,
        expanded: false,
        modifiers: [
          {
            id: "fakie-shuvit-360",
            label: "360 Shuvit",
            enabled: true,
            landRate: 50,
          },
        ],
      },
    ],
  },
  {
    id: "nollie",
    label: "Nollie",
    enabled: true,
    expanded: false,
    tricks: [
      {
        id: "nollie-ollie",
        label: "Ollie",
        enabled: true,
        landRate: 80,
        expanded: false,
        modifiers: [],
      },
      {
        id: "nollie-kickflip",
        label: "Kickflip",
        enabled: true,
        landRate: 55,
        expanded: false,
        modifiers: [],
      },
      {
        id: "nollie-heelflip",
        label: "Heelflip",
        enabled: true,
        landRate: 50,
        expanded: false,
        modifiers: [],
      },
    ],
  },
  {
    id: "switch",
    label: "Switch",
    enabled: true,
    expanded: false,
    tricks: [
      {
        id: "switch-ollie",
        label: "Ollie",
        enabled: true,
        landRate: 70,
        expanded: false,
        modifiers: [],
      },
      {
        id: "switch-kickflip",
        label: "Kickflip",
        enabled: true,
        landRate: 40,
        expanded: false,
        modifiers: [
          {
            id: "switch-kickflip-bs180",
            label: "Backside 180 Kickflip",
            enabled: true,
            landRate: 20,
          },
        ],
      },
      {
        id: "switch-heelflip",
        label: "Heelflip",
        enabled: true,
        landRate: 35,
        expanded: false,
        modifiers: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Enable LayoutAnimation on Android
// ---------------------------------------------------------------------------

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LandRateSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <View style={sliderStyles.row}>
      <Text style={[sliderStyles.label, disabled && sliderStyles.disabledText]}>
        {value}%
      </Text>
      <Slider
        style={sliderStyles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={disabled ? "#ccc" : "#1E8FFF"}
        maximumTrackTintColor="#e0e0e0"
        thumbTintColor={disabled ? "#ccc" : "#1E8FFF"}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  label: { width: 36, fontSize: 12, color: "#555", textAlign: "right" },
  disabledText: { color: "#bbb" },
  slider: { flex: 1, height: 36 },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function Options() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [letters, setLetters] = useState("SK8");
  const [stances, setStances] = useState<StanceGroup[]>(INITIAL_STANCES);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // --- Stance-level handlers ---

  const toggleStanceExpand = (stanceId: string) => {
    animate();
    setStances((prev) =>
      prev.map((s) =>
        s.id === stanceId ? { ...s, expanded: !s.expanded } : s,
      ),
    );
  };

  const toggleStanceEnabled = (stanceId: string, value: boolean) => {
    setStances((prev) =>
      prev.map((s) => (s.id === stanceId ? { ...s, enabled: value } : s)),
    );
  };

  // --- Trick-level handlers ---

  const toggleTrickExpand = (stanceId: string, trickId: string) => {
    animate();
    setStances((prev) =>
      prev.map((s) =>
        s.id !== stanceId
          ? s
          : {
              ...s,
              tricks: s.tricks.map((t) =>
                t.id === trickId ? { ...t, expanded: !t.expanded } : t,
              ),
            },
      ),
    );
  };

  const toggleTrickEnabled = (
    stanceId: string,
    trickId: string,
    value: boolean,
  ) => {
    setStances((prev) =>
      prev.map((s) =>
        s.id !== stanceId
          ? s
          : {
              ...s,
              tricks: s.tricks.map((t) =>
                t.id === trickId ? { ...t, enabled: value } : t,
              ),
            },
      ),
    );
  };

  const setTrickLandRate = (
    stanceId: string,
    trickId: string,
    rate: number,
  ) => {
    setStances((prev) =>
      prev.map((s) =>
        s.id !== stanceId
          ? s
          : {
              ...s,
              tricks: s.tricks.map((t) =>
                t.id === trickId ? { ...t, landRate: rate } : t,
              ),
            },
      ),
    );
  };

  // --- Modifier-level handlers ---

  const toggleModifierEnabled = (
    stanceId: string,
    trickId: string,
    modId: string,
    value: boolean,
  ) => {
    setStances((prev) =>
      prev.map((s) =>
        s.id !== stanceId
          ? s
          : {
              ...s,
              tricks: s.tricks.map((t) =>
                t.id !== trickId
                  ? t
                  : {
                      ...t,
                      modifiers: t.modifiers.map((m) =>
                        m.id === modId ? { ...m, enabled: value } : m,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const setModifierLandRate = (
    stanceId: string,
    trickId: string,
    modId: string,
    rate: number,
  ) => {
    setStances((prev) =>
      prev.map((s) =>
        s.id !== stanceId
          ? s
          : {
              ...s,
              tricks: s.tricks.map((t) =>
                t.id !== trickId
                  ? t
                  : {
                      ...t,
                      modifiers: t.modifiers.map((m) =>
                        m.id === modId ? { ...m, landRate: rate } : m,
                      ),
                    },
              ),
            },
      ),
    );
  };

  // --- Build config and start game ---

  const routeGame = () => {
    router.push({
      pathname: "/classic/roshambo",
      params: { difficulty, letters, config: JSON.stringify(stances) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Classic" showBackButton />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Difficulty ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Difficulty</Text>
          <SegmentedControl
            options={["Easy", "Medium", "Hard", "Custom"]}
            selected={difficulty}
            onSelect={setDifficulty}
            strict
          />
        </View>

        {/* ── Letters ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Letters</Text>
          <SegmentedControl
            options={["SK8", "SKATE", "SKATEBOARD"]}
            selected={letters}
            onSelect={setLetters}
            strict
          />
        </View>

        {/* ── Custom difficulty editor ── */}
        {difficulty === "Custom" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Custom Trick Pool</Text>

            {stances.map((stance) => (
              <View key={stance.id} style={styles.stanceCard}>
                {/* Stance header */}
                <View style={styles.rowBetween}>
                  <TouchableOpacity
                    style={styles.expandRow}
                    onPress={() => toggleStanceExpand(stance.id)}
                  >
                    <Text style={styles.chevron}>
                      {stance.expanded ? "▾" : "▸"}
                    </Text>
                    <Text style={styles.stanceLabel}>{stance.label}</Text>
                    <Text style={styles.stanceMeta}>
                      {stance.tricks.filter((t) => t.enabled).length}/
                      {stance.tricks.length} tricks
                    </Text>
                  </TouchableOpacity>
                  <Switch
                    value={stance.enabled}
                    onValueChange={(v) => toggleStanceEnabled(stance.id, v)}
                    trackColor={{ false: "#ddd", true: "#1E8FFF" }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Trick list */}
                {stance.expanded && (
                  <View style={styles.trickList}>
                    {stance.tricks.map((trick) => {
                      const trickDisabled = !stance.enabled;
                      return (
                        <View key={trick.id} style={styles.trickCard}>
                          {/* Trick header */}
                          <View style={styles.rowBetween}>
                            <TouchableOpacity
                              style={styles.expandRow}
                              disabled={
                                trickDisabled || trick.modifiers.length === 0
                              }
                              onPress={() =>
                                toggleTrickExpand(stance.id, trick.id)
                              }
                            >
                              {trick.modifiers.length > 0 && (
                                <Text
                                  style={[
                                    styles.chevron,
                                    trickDisabled && styles.disabledText,
                                  ]}
                                >
                                  {trick.expanded ? "▾" : "▸"}
                                </Text>
                              )}
                              <Text
                                style={[
                                  styles.trickLabel,
                                  trickDisabled && styles.disabledText,
                                ]}
                              >
                                {trick.label}
                              </Text>
                            </TouchableOpacity>
                            <Switch
                              value={trick.enabled && stance.enabled}
                              disabled={trickDisabled}
                              onValueChange={(v) =>
                                toggleTrickEnabled(stance.id, trick.id, v)
                              }
                              trackColor={{ false: "#ddd", true: "#1E8FFF" }}
                              thumbColor="#fff"
                            />
                          </View>

                          {/* Trick land rate */}
                          <LandRateSlider
                            value={trick.landRate}
                            disabled={trickDisabled || !trick.enabled}
                            onChange={(v) =>
                              setTrickLandRate(stance.id, trick.id, v)
                            }
                          />

                          {/* Modifiers */}
                          {trick.expanded &&
                            trick.modifiers.map((mod) => {
                              const modDisabled =
                                trickDisabled || !trick.enabled;
                              return (
                                <View key={mod.id} style={styles.modifierCard}>
                                  <View style={styles.rowBetween}>
                                    <Text
                                      style={[
                                        styles.modifierLabel,
                                        modDisabled && styles.disabledText,
                                      ]}
                                    >
                                      {mod.label}
                                    </Text>
                                    <Switch
                                      value={mod.enabled && !modDisabled}
                                      disabled={modDisabled}
                                      onValueChange={(v) =>
                                        toggleModifierEnabled(
                                          stance.id,
                                          trick.id,
                                          mod.id,
                                          v,
                                        )
                                      }
                                      trackColor={{
                                        false: "#ddd",
                                        true: "#1E8FFF",
                                      }}
                                      thumbColor="#fff"
                                    />
                                  </View>
                                  <LandRateSlider
                                    value={mod.landRate}
                                    disabled={modDisabled || !mod.enabled}
                                    onChange={(v) =>
                                      setModifierLandRate(
                                        stance.id,
                                        trick.id,
                                        mod.id,
                                        v,
                                      )
                                    }
                                  />
                                </View>
                              );
                            })}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Start button ── */}
        <TouchableOpacity style={styles.startButton} onPress={routeGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Stance card
  stanceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stanceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    flex: 1,
  },
  stanceMeta: {
    fontSize: 12,
    color: "#aaa",
    marginRight: 8,
  },

  // Trick card
  trickList: {
    marginTop: 10,
    gap: 8,
  },
  trickCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  trickLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },

  // Modifier card
  modifierCard: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  modifierLabel: {
    fontSize: 13,
    color: "#444",
    flex: 1,
  },

  // Shared
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  chevron: {
    fontSize: 12,
    color: "#888",
    width: 14,
  },
  disabledText: {
    color: "#bbb",
  },

  // Start button
  startButton: {
    backgroundColor: "#1E8FFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
