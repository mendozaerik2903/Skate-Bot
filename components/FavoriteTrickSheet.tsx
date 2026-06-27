import { BotTrickEntry } from "@/utility/pool-builder";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Modal,
    Platform,
    SectionList,
    StyleSheet,
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

export type FavoriteTrickSheetProps = {
  visible: boolean;
  onClose: () => void;
  pool: BotTrickEntry[];
  currentFavorite?: string | null;
  onSave: (fullString: string) => void;
};

const STANCES = ["regular", "switch", "nollie", "fakie"] as const;
type StanceFilter = (typeof STANCES)[number];

type TrickSection = {
  trickName: string;
  data: BotTrickEntry[];
};

function buildSections(pool: BotTrickEntry[]): TrickSection[] {
  const map = new Map<string, BotTrickEntry[]>();
  for (const entry of pool) {
    const existing = map.get(entry.trick) ?? [];
    existing.push(entry);
    map.set(entry.trick, existing);
  }
  return Array.from(map.entries()).map(([trickName, entries]) => ({
    trickName,
    data: entries,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entryKey(entry: BotTrickEntry): string {
  return entry.fullString;
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  trickName,
  isCollapsed,
  onPress,
}: {
  trickName: string;
  isCollapsed: boolean;
  onPress: () => void;
}) {
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
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Entry row — read-only (persona mode)
// ---------------------------------------------------------------------------

function SelectableEntryRow({
  entry,
  selected,
  onPress,
}: {
  entry: BotTrickEntry;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[rowStyles.container, selected && rowStyles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[rowStyles.fullString, selected && rowStyles.selectedText]}>
        {entry.fullString}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FavoriteTrickSheet({
  visible,
  onClose,
  pool,
  currentFavorite = null,
  onSave,
}: FavoriteTrickSheetProps) {
  const [stanceFilter, setStanceFilter] = useState<StanceFilter>("regular");
  const [selectedFullString, setSelectedFullString] = useState<string | null>(
    currentFavorite,
  );

  const sections = useMemo(() => {
    const filtered = pool.filter((e) => e.stance === "regular");
    return buildSections(filtered);
  }, [pool]);

  useEffect(() => {
    if (visible) {
      if (currentFavorite) {
        const parts = currentFavorite.split(" ");
        const stance = STANCES.find((s) => s === parts[0]);
        if (stance && stance !== "regular") {
          setStanceFilter(stance);
          setSelectedFullString(parts.slice(1).join(" "));
        } else {
          setStanceFilter("regular");
          setSelectedFullString(currentFavorite);
        }
      } else {
        setStanceFilter("regular");
        setSelectedFullString(null);
      }
    }
  }, [visible, currentFavorite]);

  const handleSelect = useCallback((fullString: string) => {
    setSelectedFullString(fullString);
  }, []);

  const handleDone = () => {
    if (!selectedFullString) return;
    const full =
      stanceFilter === "regular"
        ? selectedFullString
        : `${stanceFilter} ${selectedFullString}`;
    onSave(full);
    onClose();
  };

  function SectionHeader({ trickName }: { trickName: string }) {
    return (
      <View style={headerStyles.container}>
        <Text style={headerStyles.name}>{trickName}</Text>
      </View>
    );
  }

  const headerStyles = StyleSheet.create({
    container: {
      backgroundColor: "#f5f5f5",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: "#ececec",
    },
    name: {
      fontSize: 13,
      fontWeight: "700",
      color: "#888",
      textTransform: "capitalize",
    },
  });

  const sheetTitle = "Favorite Trick";

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
                {selectedFullString ?? "No trick selected"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                sheetStyles.saveButton,
                !selectedFullString && sheetStyles.saveButtonDisabled,
              ]}
              onPress={handleDone}
              disabled={!selectedFullString}
            >
              <Text style={sheetStyles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Trick list */}
          {/* Stance picker */}
          <View style={stanceStyles.container}>
            {STANCES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  stanceStyles.segment,
                  stanceFilter === s && stanceStyles.active,
                ]}
                onPress={() => setStanceFilter(s)}
              >
                <Text
                  style={[
                    stanceStyles.label,
                    stanceFilter === s && stanceStyles.labelActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.fullString}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <SectionHeader trickName={section.trickName} />
            )}
            renderItem={({ item }) => (
              <SelectableEntryRow
                entry={item}
                selected={selectedFullString === item.fullString}
                onPress={() => handleSelect(item.fullString)}
              />
            )}
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
  saveButtonDisabled: {
    backgroundColor: "#cdd9e6",
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 16,
  },
});

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

const rowStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  selected: {
    backgroundColor: "#E8F2FF",
  },
  fullString: {
    fontSize: 13,
    color: "#222",
    textTransform: "capitalize",
  },
  selectedText: {
    color: "#1E90FF",
    fontWeight: "600",
  },
});

const stanceStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    padding: 3,
    gap: 3,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
  },
  active: {
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#888",
    textTransform: "capitalize",
  },
  labelActive: {
    color: "#111",
  },
});
