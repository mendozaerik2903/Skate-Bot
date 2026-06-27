import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { landRateScaleColor } from "@/constants/difficulty";
import { Stance, stanceOptions, trickOptions } from "@/constants/trick-options";
import { CustomCard } from "@/utility/bot-builder";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";
import Slider from "@react-native-community/slider";
import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
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

export type CustomPoolEditorProps = {
  visible: boolean;
  onClose: () => void;
  activeCard: CustomCard;
  onSave: (updatedPool: BotTrickEntry[]) => void;
};

// Editor state keyed by "trick|rotation|stance"
// e.g. "kickflip|BS 180|switch" -> { enabled, landRate }
type VariantState = {
  enabled: boolean;
  landRate: number; // 0–1
};

type EditorState = Record<string, VariantState>;

// A variant row = one fully-named trick (e.g. "bs 180 kickflip") with all its stances
type VariantRow = {
  // The display name for the row header (e.g. "bs 180 kickflip", "kickflip")
  displayName: string;
  trick: string;
  rotation: string;
  // All four stance entries from the master catalog for this trick+rotation
  stanceEntries: BotTrickEntry[];
};

// A category = one base trick name with all its variant rows
type TrickCategory = {
  trickName: string; // e.g. "kickflip"
  variantRows: VariantRow[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STANCE_LABELS: Record<Stance, string> = {
  regular: "Regular",
  fakie: "Fakie",
  nollie: "Nollie",
  switch: "Switch",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function editorKey(trick: string, rotation: string, stance: Stance): string {
  return `${trick}|${rotation}|${stance}`;
}

// landRateColor moved to constants/difficulty.ts as landRateScaleColor.

// Build master catalog — all variants with no modifiers
function buildMasterCatalog(): BotTrickEntry[] {
  return buildBotPool(MASTER_BOT_TRICKS).filter(
    (entry) => entry.modifier === "",
  );
}

// Build the category/variant/stance tree from the master catalog
function buildCategories(masterCatalog: BotTrickEntry[]): TrickCategory[] {
  // Use trickOptions for canonical ordering of base trick names
  return trickOptions
    .map((trickOption) => {
      const trickName = trickOption.value;

      // Get all entries for this trick, grouped by rotation
      const rotationMap = new Map<string, BotTrickEntry[]>();
      for (const entry of masterCatalog) {
        if (entry.trick !== trickName) continue;
        const existing = rotationMap.get(entry.rotation) ?? [];
        existing.push(entry);
        rotationMap.set(entry.rotation, existing);
      }

      // Sort rotations: base ("") first, then others in natural order
      const rotations = Array.from(rotationMap.keys()).sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return a.localeCompare(b);
      });

      const variantRows: VariantRow[] = rotations.map((rotation) => {
        const stanceEntries = stanceOptions
          .map((stance) =>
            rotationMap.get(rotation)?.find((e) => e.stance === stance),
          )
          .filter((e): e is BotTrickEntry => e !== undefined);

        // Display name: use fullString of the regular stance entry as canonical label
        // Falls back to first available stance entry
        const canonical =
          stanceEntries.find((e) => e.stance === "regular") ?? stanceEntries[0];
        const displayName = canonical?.fullString ?? trickName;

        return { displayName, trick: trickName, rotation, stanceEntries };
      });

      return { trickName, variantRows };
    })
    .filter((cat) => cat.variantRows.length > 0);
}

// Build initial editor state from master catalog overlaid with saved pool
function buildInitialEditorState(
  masterCatalog: BotTrickEntry[],
  savedPool: BotTrickEntry[] | null,
): EditorState {
  const savedMap = new Map<string, number>();
  if (savedPool) {
    for (const entry of savedPool) {
      savedMap.set(
        editorKey(entry.trick, entry.rotation, entry.stance),
        entry.landRate,
      );
    }
  }

  const state: EditorState = {};
  for (const entry of masterCatalog) {
    const key = editorKey(entry.trick, entry.rotation, entry.stance);
    const savedRate = savedMap.get(key);
    state[key] = {
      enabled: savedRate !== undefined,
      landRate: savedRate ?? entry.landRate, // fall back to master rate
    };
  }
  return state;
}

// ---------------------------------------------------------------------------
// Stance row — one stance inside an expanded variant row
// ---------------------------------------------------------------------------

function StanceRow({
  stance,
  stateValue,
  onToggle,
  onRateChange,
}: {
  stance: Stance;
  stateValue: VariantState;
  onToggle: (enabled: boolean) => void;
  onRateChange: (rate: number) => void;
}) {
  const dimmed = !stateValue.enabled;
  const color = landRateScaleColor(stateValue.landRate);

  return (
    <View style={[stanceRowStyles.container, dimmed && stanceRowStyles.dimmed]}>
      <View style={stanceRowStyles.headerRow}>
        <Text
          style={[stanceRowStyles.label, dimmed && stanceRowStyles.dimmedText]}
        >
          {STANCE_LABELS[stance]}
        </Text>
        <Switch
          value={stateValue.enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#ddd", true: "#1E90FF" }}
          thumbColor="#fff"
          style={stanceRowStyles.switch}
        />
      </View>
      {stateValue.enabled ? (
        <View style={stanceRowStyles.sliderRow}>
          <Text style={[stanceRowStyles.pct, { color }]}>
            {Math.round(stateValue.landRate * 100)}%
          </Text>
          <Slider
            style={stanceRowStyles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={stateValue.landRate}
            onValueChange={onRateChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor={color}
          />
        </View>
      ) : (
        <View style={stanceRowStyles.sliderRow}>
          <Text style={[stanceRowStyles.pct, stanceRowStyles.dimmedText]}>
            —
          </Text>
          <View style={stanceRowStyles.disabledTrack} />
        </View>
      )}
    </View>
  );
}

const stanceRowStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dimmed: {
    backgroundColor: "#fafafa",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 13,
    color: "#222",
    flex: 1,
  },
  dimmedText: {
    color: "#bbb",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  sliderRow: {
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
  slider: {
    flex: 1,
    height: 32,
  },
  disabledTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#e8e8e8",
    borderRadius: 3,
    marginVertical: 6,
  },
});

// ---------------------------------------------------------------------------
// Variant row — e.g. "bs 180 kickflip" with expandable stance rows
// ---------------------------------------------------------------------------

function VariantRowItem({
  variant,
  editorState,
  isExpanded,
  onToggleExpand,
  onStanceToggle,
  onStanceRateChange,
}: {
  variant: VariantRow;
  editorState: EditorState;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStanceToggle: (key: string, enabled: boolean) => void;
  onStanceRateChange: (key: string, rate: number) => void;
}) {
  const enabledCount = variant.stanceEntries.filter((e) => {
    const key = editorKey(e.trick, e.rotation, e.stance);
    return editorState[key]?.enabled;
  }).length;

  return (
    <View style={variantRowStyles.container}>
      <TouchableOpacity
        style={variantRowStyles.header}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={variantRowStyles.leftRow}>
          <Text style={variantRowStyles.chevron}>{isExpanded ? "▾" : "▸"}</Text>
          <Text style={variantRowStyles.name}>{variant.displayName}</Text>
        </View>
        <Text style={variantRowStyles.meta}>
          {enabledCount}/{variant.stanceEntries.length}
        </Text>
      </TouchableOpacity>

      {isExpanded &&
        variant.stanceEntries.map((entry) => {
          const key = editorKey(entry.trick, entry.rotation, entry.stance);
          const stateValue = editorState[key] ?? {
            enabled: false,
            landRate: entry.landRate,
          };
          return (
            <StanceRow
              key={key}
              stance={entry.stance}
              stateValue={stateValue}
              onToggle={(enabled) => onStanceToggle(key, enabled)}
              onRateChange={(rate) => onStanceRateChange(key, rate)}
            />
          );
        })}
    </View>
  );
}

const variantRowStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  chevron: {
    fontSize: 11,
    color: "#888",
    width: 14,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    textTransform: "capitalize",
    flex: 1,
  },
  meta: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 8,
  },
});

// ---------------------------------------------------------------------------
// Category — base trick name with all its variant rows
// ---------------------------------------------------------------------------

function TrickCategoryItem({
  category,
  editorState,
  isCategoryExpanded,
  expandedVariants,
  onToggleCategory,
  onToggleVariant,
  onStanceToggle,
  onStanceRateChange,
}: {
  category: TrickCategory;
  editorState: EditorState;
  isCategoryExpanded: boolean;
  expandedVariants: Set<string>;
  onToggleCategory: () => void;
  onToggleVariant: (variantKey: string) => void;
  onStanceToggle: (key: string, enabled: boolean) => void;
  onStanceRateChange: (key: string, rate: number) => void;
}) {
  // Count all enabled stances across all variants in this category
  const enabledCount = category.variantRows.reduce((sum, v) => {
    return (
      sum +
      v.stanceEntries.filter((e) => {
        return editorState[editorKey(e.trick, e.rotation, e.stance)]?.enabled;
      }).length
    );
  }, 0);

  return (
    <View style={categoryStyles.container}>
      <TouchableOpacity
        style={categoryStyles.header}
        onPress={onToggleCategory}
        activeOpacity={0.7}
      >
        <View style={categoryStyles.leftRow}>
          <Text style={categoryStyles.chevron}>
            {isCategoryExpanded ? "▾" : "▸"}
          </Text>
          <Text style={categoryStyles.name}>{category.trickName}</Text>
          <Text style={categoryStyles.variantCount}>
            {category.variantRows.length} variant
            {category.variantRows.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {enabledCount > 0 && (
          <View style={categoryStyles.badge}>
            <Text style={categoryStyles.badgeText}>{enabledCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isCategoryExpanded && (
        <View style={categoryStyles.variantList}>
          {category.variantRows.map((variant) => {
            const vKey = `${variant.trick}|${variant.rotation}`;
            return (
              <VariantRowItem
                key={vKey}
                variant={variant}
                editorState={editorState}
                isExpanded={expandedVariants.has(vKey)}
                onToggleExpand={() => onToggleVariant(vKey)}
                onStanceToggle={onStanceToggle}
                onStanceRateChange={onStanceRateChange}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const categoryStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: "#888",
    width: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    textTransform: "capitalize",
  },
  variantCount: {
    fontSize: 12,
    color: "#aaa",
  },
  badge: {
    backgroundColor: "#1E90FF",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  variantList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 4,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CustomPoolEditor({
  visible,
  onClose,
  activeCard,
  onSave,
}: CustomPoolEditorProps) {
  const masterCatalog = useMemo(() => buildMasterCatalog(), []);
  const categories = useMemo(
    () => buildCategories(masterCatalog),
    [masterCatalog],
  );

  // Editor state — keyed by "trick|rotation|stance"
  const [editorState, setEditorState] = useState<EditorState>(() =>
    buildInitialEditorState(masterCatalog, activeCard.savedPool),
  );

  // Reinitialise when a different custom card becomes active
  const [lastCardId, setLastCardId] = useState(activeCard.id);
  if (activeCard.id !== lastCardId) {
    setLastCardId(activeCard.id);
    setEditorState(
      buildInitialEditorState(masterCatalog, activeCard.savedPool),
    );
  }

  // Category expand/collapse — all collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Variant expand/collapse — all collapsed by default
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(
    new Set(),
  );

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggleCategory = useCallback((trickName: string) => {
    animate();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(trickName) ? next.delete(trickName) : next.add(trickName);
      return next;
    });
  }, []);

  const toggleVariant = useCallback((vKey: string) => {
    animate();
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.has(vKey) ? next.delete(vKey) : next.add(vKey);
      return next;
    });
  }, []);

  const handleStanceToggle = useCallback((key: string, enabled: boolean) => {
    animate();
    setEditorState((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }));
  }, []);

  const handleStanceRateChange = useCallback((key: string, rate: number) => {
    setEditorState((prev) => ({
      ...prev,
      [key]: { ...prev[key], landRate: rate },
    }));
  }, []);

  // Save validation
  const enabledCount = useMemo(
    () => Object.values(editorState).filter((s) => s.enabled).length,
    [editorState],
  );
  const canSave = enabledCount > 0;

  const handleSave = () => {
    if (!canSave) return;
    const updatedPool = masterCatalog
      .filter((entry) => {
        const key = editorKey(entry.trick, entry.rotation, entry.stance);
        return editorState[key]?.enabled;
      })
      .map((entry) => {
        const key = editorKey(entry.trick, entry.rotation, entry.stance);
        return {
          ...entry,
          landRate: editorState[key]?.landRate ?? entry.landRate,
        };
      });
    onSave(updatedPool);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={editorStyles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={editorStyles.card}>
          {/* Handle */}
          <View style={editorStyles.handle} />

          {/* Header */}
          <View style={editorStyles.header}>
            <View>
              <Text style={editorStyles.title}>Edit · {activeCard.name}</Text>
              <Text
                style={[
                  editorStyles.subtitle,
                  !canSave && editorStyles.subtitleError,
                ]}
              >
                {canSave
                  ? `${enabledCount} stance variant${enabledCount !== 1 ? "s" : ""} enabled`
                  : "Enable at least 1 trick to save"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                editorStyles.saveButton,
                !canSave && editorStyles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={editorStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Category list */}
          <ScrollView
            contentContainerStyle={editorStyles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category) => (
              <TrickCategoryItem
                key={category.trickName}
                category={category}
                editorState={editorState}
                isCategoryExpanded={expandedCategories.has(category.trickName)}
                expandedVariants={expandedVariants}
                onToggleCategory={() => toggleCategory(category.trickName)}
                onToggleVariant={toggleVariant}
                onStanceToggle={handleStanceToggle}
                onStanceRateChange={handleStanceRateChange}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const editorStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
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
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  subtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  subtitleError: {
    color: "#FF3B30",
  },
  saveButton: {
    backgroundColor: "#1E90FF",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
});
