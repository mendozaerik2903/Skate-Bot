import {
  landRateScaleColor,
  nearestDifficultyLabel,
} from "@/constants/difficulty";
import { Difficulty } from "@/constants/types";
import { BotCard } from "@/utility/bot-builder";
import { BotTrickEntry } from "@/utility/pool-builder";
import Slider from "@react-native-community/slider";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";

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
// Types
// ---------------------------------------------------------------------------

export type TrickPoolSheetProps = {
  visible: boolean;
  onClose: () => void;
  activeCard: BotCard;
  difficulty: Difficulty | null;
  // Resolved pool for the active card — already has difficulty scalar applied
  // for persona cards; used verbatim for custom cards.
  pool: BotTrickEntry[];
  // Called only when activeCard.type === 'custom' and the user saves changes.
  onSaveCustomPool?: (updatedPool: BotTrickEntry[]) => void;
};

// Internal section shape for SectionList
type TrickSection = {
  trickName: string;
  maxLandRate: number;
  data: BotTrickEntry[];
};

// Per-entry edit state for custom mode
type EntryEditState = {
  enabled: boolean;
  landRate: number; // 0–1
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STANCE_ABBREV: Record<string, string> = {
  regular: "reg",
  fakie: "fak",
  nollie: "nol",
  switch: "swi",
};

// landRateColor moved to constants/difficulty.ts as landRateScaleColor —
// gives a continuous green→red readout instead of 3 hard buckets.

function buildSections(pool: BotTrickEntry[]): TrickSection[] {
  const map = new Map<string, BotTrickEntry[]>();
  for (const entry of pool) {
    const existing = map.get(entry.trick) ?? [];
    existing.push(entry);
    map.set(entry.trick, existing);
  }
  return Array.from(map.entries()).map(([trickName, entries]) => ({
    trickName,
    maxLandRate: Math.max(...entries.map((e) => e.landRate)),
    data: entries,
  }));
}

function buildEditStateKey(entry: BotTrickEntry): string {
  return `${entry.trick}|${entry.stance}|${entry.rotation}|${entry.modifier}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LandRateBar({
  rate,
  editable,
  onRateChange,
}: {
  rate: number;
  editable: boolean;
  onRateChange?: (v: number) => void;
}) {
  const color = landRateScaleColor(rate);
  const pct = `${Math.round(rate * 100)}%`;

  if (editable && onRateChange) {
    return (
      <View style={barStyles.row}>
        <Text style={[barStyles.pct, { color }]}>{pct}</Text>
        <Slider
          style={barStyles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={rate}
          onValueChange={onRateChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor={color}
        />
      </View>
    );
  }

  return (
    <View style={barStyles.row}>
      <Text style={[barStyles.pct, { color }]}>{pct}</Text>
      <View style={barStyles.track}>
        <View
          style={[
            barStyles.fill,
            { width: `${rate * 100}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  pct: {
    fontSize: 11,
    fontWeight: "600",
    width: 32,
    textAlign: "right",
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  slider: {
    flex: 1,
    height: 32,
  },
});

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  trickName,
  maxLandRate,
  isCollapsed,
  onPress,
}: {
  trickName: string;
  maxLandRate: number;
  isCollapsed: boolean;
  onPress: () => void;
}) {
  const color = landRateScaleColor(maxLandRate);
  return (
    <TouchableOpacity
      style={headerStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={headerStyles.leftRow}>
        <Text style={headerStyles.chevron}>{isCollapsed ? "▸" : "▾"}</Text>
        <Text style={headerStyles.name}>{trickName}</Text>
      </View>
      <Text style={[headerStyles.ceiling, { color }]}>
        up to {Math.round(maxLandRate * 100)}%
      </Text>
    </TouchableOpacity>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ececec",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevron: {
    fontSize: 11,
    color: "#888",
    width: 14,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
  },
  ceiling: {
    fontSize: 12,
    fontWeight: "600",
  },
});

// ---------------------------------------------------------------------------
// Entry row — read-only (persona mode)
// ---------------------------------------------------------------------------

function ReadOnlyEntryRow({ entry }: { entry: BotTrickEntry }) {
  const stances =
    entry.stance !== "regular"
      ? (STANCE_ABBREV[entry.stance] ?? entry.stance)
      : STANCE_ABBREV["regular"];

  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.labelRow}>
        <Text style={rowStyles.fullString}>{entry.fullString}</Text>
        <Text style={rowStyles.stance}>{stances}</Text>
      </View>
      <LandRateBar rate={entry.landRate} editable={false} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Entry row — editable (custom mode)
// ---------------------------------------------------------------------------

function EditableEntryRow({
  entry,
  editState,
  onToggle,
  onRateChange,
}: {
  entry: BotTrickEntry;
  editState: EntryEditState;
  onToggle: (enabled: boolean) => void;
  onRateChange: (rate: number) => void;
}) {
  const stances = STANCE_ABBREV[entry.stance] ?? entry.stance;
  const dimmed = !editState.enabled;

  return (
    <View style={[rowStyles.container, dimmed && rowStyles.dimmed]}>
      <View style={rowStyles.labelRow}>
        <Text style={[rowStyles.fullString, dimmed && rowStyles.dimmedText]}>
          {entry.fullString}
        </Text>
        <View style={rowStyles.rightRow}>
          <Text style={[rowStyles.stance, dimmed && rowStyles.dimmedText]}>
            {stances}
          </Text>
          <Switch
            value={editState.enabled}
            onValueChange={onToggle}
            trackColor={{ false: "#ddd", true: "#1E90FF" }}
            thumbColor="#fff"
            style={rowStyles.switch}
          />
        </View>
      </View>
      {editState.enabled && (
        <LandRateBar
          rate={editState.landRate}
          editable
          onRateChange={onRateChange}
        />
      )}
      {!editState.enabled && (
        <View style={barStyles.row}>
          <Text style={[barStyles.pct, rowStyles.dimmedText]}>—</Text>
          <View style={[barStyles.track, { backgroundColor: "#e8e8e8" }]} />
        </View>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  dimmed: {
    backgroundColor: "#fafafa",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fullString: {
    fontSize: 13,
    color: "#222",
    flex: 1,
    textTransform: "capitalize",
  },
  dimmedText: {
    color: "#bbb",
  },
  stance: {
    fontSize: 11,
    color: "#999",
    marginLeft: 8,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TrickPoolSheet({
  visible,
  onClose,
  activeCard,
  difficulty,
  pool,
  onSaveCustomPool,
}: TrickPoolSheetProps) {
  const isCustom = activeCard.type === "custom";
  // Build sections from pool
  const sections = useMemo(() => buildSections(pool), [pool]);

  // Collapse state — Set of trick names that are collapsed
  // Initialised to all section names so everything starts collapsed
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(buildSections(pool).map((s) => s.trickName)),
  );

  // Reset collapsed state when pool changes (e.g. card switch)
  useEffect(() => {
    setCollapsedSections(new Set(sections.map((s) => s.trickName)));
  }, [sections]);

  const toggleSection = useCallback((trickName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(trickName)) {
        next.delete(trickName);
      } else {
        next.add(trickName);
      }
      return next;
    });
  }, []);

  // Edit state for custom mode — keyed by fullString
  const [editStates, setEditStates] = useState<Record<string, EntryEditState>>(
    {},
  );

  // Initialise edit state when pool changes or sheet opens in custom mode
  useEffect(() => {
    if (!isCustom) return;
    const initial: Record<string, EntryEditState> = {};
    for (const entry of pool) {
      const key = buildEditStateKey(entry);
      initial[key] = { enabled: true, landRate: entry.landRate };
    }
    setEditStates(initial);
  }, [pool, isCustom]);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleToggle = useCallback((key: string, enabled: boolean) => {
    animate();
    setEditStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
  }, []);

  const handleRateChange = useCallback((key: string, rate: number) => {
    setEditStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], landRate: rate },
    }));
  }, []);

  const handleSave = () => {
    if (!onSaveCustomPool) return;
    const updatedPool = pool
      .filter((entry) => editStates[buildEditStateKey(entry)]?.enabled)
      .map((entry) => ({
        ...entry,
        landRate:
          editStates[buildEditStateKey(entry)]?.landRate ?? entry.landRate,
      }));
    onSaveCustomPool(updatedPool);
    onClose();
  };

  // Header: persona name + nearest difficulty label (read-only) or "Edit Trick Pool" (custom)
  const sheetTitle = isCustom
    ? `Edit · ${activeCard.name}`
    : `${activeCard.name}${
        difficulty !== null ? ` · ${nearestDifficultyLabel(difficulty)}` : ""
      }`;

  const enabledCount = isCustom
    ? Object.values(editStates).filter((s) => s.enabled).length
    : pool.length;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={sheetStyles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Sheet card */}
        <View style={sheetStyles.card}>
          {/* Handle */}
          <View style={sheetStyles.handle} />

          {/* Header */}
          <View style={sheetStyles.header}>
            <View>
              <Text style={sheetStyles.title}>{sheetTitle}</Text>
              <Text style={sheetStyles.subtitle}>
                {enabledCount} trick variant{enabledCount !== 1 ? "s" : ""}
              </Text>
            </View>
            {isCustom ? (
              <TouchableOpacity
                style={sheetStyles.saveButton}
                onPress={handleSave}
              >
                <Text style={sheetStyles.saveText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={sheetStyles.closeButton}
                onPress={onClose}
              >
                <Text style={sheetStyles.closeText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Trick list */}
          <SectionList
            sections={sections}
            keyExtractor={(item) =>
              `${item.trick}|${item.stance}|${item.rotation}|${item.modifier}`
            }
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <SectionHeader
                trickName={section.trickName}
                maxLandRate={section.maxLandRate}
                isCollapsed={collapsedSections.has(section.trickName)}
                onPress={() => toggleSection(section.trickName)}
              />
            )}
            renderItem={({ item }) => {
              if (collapsedSections.has(item.trick)) return null;
              if (isCustom) {
                const key = buildEditStateKey(item);
                const state = editStates[key] ?? {
                  enabled: true,
                  landRate: item.landRate,
                };
                return (
                  <EditableEntryRow
                    entry={item}
                    editState={state}
                    onToggle={(enabled) => handleToggle(key, enabled)}
                    onRateChange={(rate) => handleRateChange(key, rate)}
                  />
                );
              }
              return <ReadOnlyEntryRow entry={item} />;
            }}
            contentContainerStyle={sheetStyles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: "#1E90FF",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: "#1E90FF",
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 16,
  },
});
