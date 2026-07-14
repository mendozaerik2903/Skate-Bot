import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { fetchWithAuth } from "@/utility/fetchWithAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FavoriteSpot = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type FavoriteSpotSheetProps = {
  visible: boolean;
  onClose: () => void;
  currentFavoriteId?: string | null;
  onSave: (spot: FavoriteSpot) => void;
};

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function SpotRow({
  spot,
  selected,
  onPress,
}: {
  spot: FavoriteSpot;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[rowStyles.container, selected && rowStyles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[rowStyles.name, selected && rowStyles.selectedText]}>
        {spot.name}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FavoriteSpotSheet({
  visible,
  onClose,
  currentFavoriteId = null,
  onSave,
}: FavoriteSpotSheetProps) {
  const [spots, setSpots] = useState<FavoriteSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentFavoriteId,
  );

  useEffect(() => {
    if (visible) {
      setSelectedId(currentFavoriteId);
    }
  }, [visible, currentFavoriteId]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const response = await fetchWithAuth("/spots");
        if (!response.ok) return;
        const data: FavoriteSpot[] = await response.json();
        if (!cancelled) setSpots(data);
      } catch {
        // leave list empty on failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleDone = () => {
    const spot = spots.find((s) => s.id === selectedId);
    if (!spot) return;
    onSave(spot);
    onClose();
  };

  const selectedSpot = spots.find((s) => s.id === selectedId);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={sheetStyles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={sheetStyles.card}>
          <View style={sheetStyles.handle} />

          <View style={sheetStyles.header}>
            <View>
              <Text style={sheetStyles.title}>Favorite Skatepark</Text>
              <Text style={sheetStyles.subtitle}>
                {selectedSpot?.name ?? "No spot selected"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                sheetStyles.saveButton,
                !selectedId && sheetStyles.saveButtonDisabled,
              ]}
              onPress={handleDone}
              disabled={!selectedId}
            >
              <Text style={sheetStyles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={spots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SpotRow
                spot={item}
                selected={selectedId === item.id}
                onPress={() => handleSelect(item.id)}
              />
            )}
            ListEmptyComponent={
              !loading ? (
                <Text style={sheetStyles.emptyText}>No spots found</Text>
              ) : null
            }
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
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    paddingVertical: 24,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  selected: {
    backgroundColor: "#E8F2FF",
  },
  name: {
    fontSize: 14,
    color: "#222",
  },
  selectedText: {
    color: "#1E90FF",
    fontWeight: "600",
  },
});