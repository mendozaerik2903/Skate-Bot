import CustomHeader from "@/components/CustomHeader";
import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { landRateScaleColor } from "@/constants/difficulty";
import { Stance, stanceOptions, trickOptions } from "@/constants/trick-options";
import {
  BotCard,
  deleteBotCard,
  loadBotCards,
  upsertBotCard,
} from "@/utility/bot-builder";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
// Trick pool editor types
// ---------------------------------------------------------------------------

// Editor state keyed by "trick|rotation|stance"
type VariantState = {
  enabled: boolean;
  landRate: number; // 0–1, land success rate
  sampleWeight: number; // 0–1, pick rate — only editable in advanced mode
};

type EditorState = Record<string, VariantState>;

// A variant row = one fully-named trick (e.g. "bs 180 kickflip") with all its stances
type VariantRow = {
  displayName: string;
  trick: string;
  rotation: string;
  stanceEntries: BotTrickEntry[];
};

// A category = one base trick name with all its variant rows
type TrickCategory = {
  trickName: string;
  variantRows: VariantRow[];
};

const STANCE_LABELS: Record<Stance, string> = {
  regular: "Regular",
  fakie: "Fakie",
  nollie: "Nollie",
  switch: "Switch",
};

const WEIGHT_COLOR = "#9B59B6";

// ---------------------------------------------------------------------------
// Trick pool editor helpers
// ---------------------------------------------------------------------------

function editorKey(trick: string, rotation: string, stance: Stance): string {
  return `${trick}|${rotation}|${stance}`;
}

// Build master catalog — all variants with no modifiers
function buildMasterCatalog(): BotTrickEntry[] {
  return buildBotPool(MASTER_BOT_TRICKS).filter(
    (entry) => entry.modifier === "",
  );
}

// Build the category/variant/stance tree from the master catalog
function buildCategories(masterCatalog: BotTrickEntry[]): TrickCategory[] {
  return trickOptions
    .map((trickOption) => {
      const trickName = trickOption.value;

      const rotationMap = new Map<string, BotTrickEntry[]>();
      for (const entry of masterCatalog) {
        if (entry.trick !== trickName) continue;
        const existing = rotationMap.get(entry.rotation) ?? [];
        existing.push(entry);
        rotationMap.set(entry.rotation, existing);
      }

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

        const canonical =
          stanceEntries.find((e) => e.stance === "regular") ?? stanceEntries[0];
        const displayName = canonical?.fullString ?? trickName;

        return { displayName, trick: trickName, rotation, stanceEntries };
      });

      return { trickName, variantRows };
    })
    .filter((cat) => cat.variantRows.length > 0);
}

// Build initial editor state from master catalog overlaid with saved pool.
function buildInitialEditorState(
  masterCatalog: BotTrickEntry[],
  savedPool: BotTrickEntry[] | null,
): EditorState {
  const savedMap = new Map<
    string,
    { landRate: number; sampleWeight: number }
  >();
  if (savedPool) {
    for (const entry of savedPool) {
      savedMap.set(editorKey(entry.trick, entry.rotation, entry.stance), {
        landRate: entry.landRate,
        sampleWeight: entry.sampleWeight,
      });
    }
  }

  const state: EditorState = {};
  for (const entry of masterCatalog) {
    const key = editorKey(entry.trick, entry.rotation, entry.stance);
    const saved = savedMap.get(key);
    state[key] = {
      enabled: saved !== undefined,
      landRate: saved?.landRate ?? entry.landRate,
      sampleWeight: saved?.sampleWeight ?? entry.landRate,
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
  advancedMode,
  onToggle,
  onRateChange,
  onWeightChange,
}: {
  stance: Stance;
  stateValue: VariantState;
  advancedMode: boolean;
  onToggle: (enabled: boolean) => void;
  onRateChange: (rate: number) => void;
  onWeightChange: (weight: number) => void;
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
        <>
          <View style={stanceRowStyles.sliderRow}>
            <Text style={stanceRowStyles.sliderTag}>Land</Text>
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
          {advancedMode && (
            <View style={stanceRowStyles.sliderRow}>
              <Text style={[stanceRowStyles.sliderTag, { color: WEIGHT_COLOR }]}>
                Pick
              </Text>
              <Text style={[stanceRowStyles.pct, { color: WEIGHT_COLOR }]}>
                {stateValue.sampleWeight.toFixed(2)}
              </Text>
              <Slider
                style={stanceRowStyles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={stateValue.sampleWeight}
                onValueChange={onWeightChange}
                minimumTrackTintColor={WEIGHT_COLOR}
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor={WEIGHT_COLOR}
              />
            </View>
          )}
        </>
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
  sliderTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    width: 28,
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
  advancedMode,
  isExpanded,
  onToggleExpand,
  onStanceToggle,
  onStanceRateChange,
  onStanceWeightChange,
}: {
  variant: VariantRow;
  editorState: EditorState;
  advancedMode: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStanceToggle: (key: string, enabled: boolean) => void;
  onStanceRateChange: (key: string, rate: number) => void;
  onStanceWeightChange: (key: string, weight: number) => void;
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
            sampleWeight: entry.landRate,
          };
          return (
            <StanceRow
              key={key}
              stance={entry.stance}
              stateValue={stateValue}
              advancedMode={advancedMode}
              onToggle={(enabled) => onStanceToggle(key, enabled)}
              onRateChange={(rate) => onStanceRateChange(key, rate)}
              onWeightChange={(weight) => onStanceWeightChange(key, weight)}
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
  advancedMode,
  isCategoryExpanded,
  expandedVariants,
  onToggleCategory,
  onToggleVariant,
  onStanceToggle,
  onStanceRateChange,
  onStanceWeightChange,
}: {
  category: TrickCategory;
  editorState: EditorState;
  advancedMode: boolean;
  isCategoryExpanded: boolean;
  expandedVariants: Set<string>;
  onToggleCategory: () => void;
  onToggleVariant: (variantKey: string) => void;
  onStanceToggle: (key: string, enabled: boolean) => void;
  onStanceRateChange: (key: string, rate: number) => void;
  onStanceWeightChange: (key: string, weight: number) => void;
}) {
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
                advancedMode={advancedMode}
                isExpanded={expandedVariants.has(vKey)}
                onToggleExpand={() => onToggleVariant(vKey)}
                onStanceToggle={onStanceToggle}
                onStanceRateChange={onStanceRateChange}
                onStanceWeightChange={onStanceWeightChange}
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
// Screen — resolves bot from route params, then mounts the editor body
// ---------------------------------------------------------------------------

export default function BotEditScreen() {
  const { botCardId } = useLocalSearchParams<{ botCardId: string }>();
  const [bot, setBot] = useState<BotCard | null>(null);

  useEffect(() => {
    loadBotCards().then((bots) => {
      setBot(bots.find((b) => b.id === botCardId) ?? null);
    });
  }, [botCardId]);

  if (!bot) return null;

  return <BotEditBody initialBot={bot} />;
}

// ---------------------------------------------------------------------------
// Body — fields + inline trick pool editor
// ---------------------------------------------------------------------------

function BotEditBody({ initialBot }: { initialBot: BotCard }) {
  const [bot, setBot] = useState(initialBot);

  const masterCatalog = useMemo(() => buildMasterCatalog(), []);
  const categories = useMemo(
    () => buildCategories(masterCatalog),
    [masterCatalog],
  );

  const [editorState, setEditorState] = useState<EditorState>(() =>
    buildInitialEditorState(masterCatalog, initialBot.savedPool),
  );
  const [advancedMode, setAdvancedMode] = useState(initialBot.advancedMode);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(
    new Set(),
  );

  // ── Name / description / emoji fields ──
  const handleFieldChange = useCallback(
    (field: "name" | "description" | "avatarEmoji", value: string) => {
      setBot((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFieldCommit = useCallback(async () => {
    await upsertBotCard(bot);
  }, [bot]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Bot",
      `Are you sure you want to delete "${bot.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = await deleteBotCard(bot.id);
            if (updated === null) {
              Alert.alert("Can't Delete", "At least one bot must remain.");
              return;
            }
            router.back();
          },
        },
      ],
    );
  }, [bot]);

  // ── Trick pool editor ──
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

  const handleStanceWeightChange = useCallback(
    (key: string, weight: number) => {
      setEditorState((prev) => ({
        ...prev,
        [key]: { ...prev[key], sampleWeight: weight },
      }));
    },
    [],
  );

  const enabledCount = useMemo(
    () => Object.values(editorState).filter((s) => s.enabled).length,
    [editorState],
  );
  const canSavePool = enabledCount > 0;

  const handleSavePool = useCallback(async () => {
    if (!canSavePool) return;
    const updatedPool = masterCatalog
      .filter((entry) => {
        const key = editorKey(entry.trick, entry.rotation, entry.stance);
        return editorState[key]?.enabled;
      })
      .map((entry) => {
        const key = editorKey(entry.trick, entry.rotation, entry.stance);
        const state = editorState[key];
        return {
          ...entry,
          landRate: state?.landRate ?? entry.landRate,
          sampleWeight: state?.sampleWeight ?? entry.landRate,
        };
      });

    const updatedBot: BotCard = { ...bot, savedPool: updatedPool, advancedMode };
    await upsertBotCard(updatedBot);
    setBot(updatedBot);
  }, [bot, canSavePool, editorState, advancedMode, masterCatalog]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader
        title="edit bot"
        showBackButton
        rightIconName="trash-outline"
        onRightIconPress={handleDelete}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Name / description / emoji ── */}
          <View style={styles.editRow}>
            <TextInput
              style={styles.emojiInput}
              value={bot.avatarEmoji}
              onChangeText={(v) =>
                handleFieldChange("avatarEmoji", v.slice(-2))
              }
              onBlur={handleFieldCommit}
              maxLength={2}
            />
            <TextInput
              style={styles.nameInput}
              value={bot.name}
              onChangeText={(v) => handleFieldChange("name", v)}
              onBlur={handleFieldCommit}
              placeholder="Bot name"
              placeholderTextColor={"grey"}
            />
          </View>
          <TextInput
            style={styles.descriptionInput}
            value={bot.description}
            onChangeText={(v) => handleFieldChange("description", v)}
            onBlur={handleFieldCommit}
            placeholder="Description"
            placeholderTextColor={"grey"}
            returnKeyType="done"
          />

          {/* ── Trick pool section ── */}
          <View style={styles.poolSectionHeader}>
            <View style={styles.poolSectionTextColumn}>
              <Text style={styles.poolSectionTitle}>Trick Pool</Text>
              <Text
                style={[
                  styles.poolSubtitle,
                  !canSavePool && styles.poolSubtitleError,
                ]}
              >
                {canSavePool
                  ? `${enabledCount} stance variant${enabledCount !== 1 ? "s" : ""} enabled`
                  : "Enable at least 1 trick to save"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !canSavePool && styles.saveButtonDisabled,
              ]}
              onPress={handleSavePool}
              disabled={!canSavePool}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.advancedRow}>
            <View style={styles.advancedTextColumn}>
              <Text style={styles.advancedLabel}>Pick Rates</Text>
              <Text style={styles.advancedSubtitle}>
                Rate at which a trick is chosen to be attempted.
              </Text>
            </View>
            <Switch
              value={advancedMode}
              onValueChange={setAdvancedMode}
              trackColor={{ false: "#ddd", true: WEIGHT_COLOR }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TrickCategoryItem
                key={category.trickName}
                category={category}
                editorState={editorState}
                advancedMode={advancedMode}
                isCategoryExpanded={expandedCategories.has(category.trickName)}
                expandedVariants={expandedVariants}
                onToggleCategory={() => toggleCategory(category.trickName)}
                onToggleVariant={toggleVariant}
                onStanceToggle={handleStanceToggle}
                onStanceRateChange={handleStanceRateChange}
                onStanceWeightChange={handleStanceWeightChange}
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  flex: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  // Name / description / emoji
  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emojiInput: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 22,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  descriptionInput: {
    fontSize: 14,
    color: "#444",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },

  // Trick pool section
  poolSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  poolSectionTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  poolSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  poolSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  poolSubtitleError: {
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
  advancedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  advancedTextColumn: {
    flex: 1,
    paddingRight: 12,
  },
  advancedLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  advancedSubtitle: {
    fontSize: 11,
    color: "#999",
    marginTop: 1,
  },
  categoryList: {
    gap: 12,
  },
});