import CustomHeader from "@/components/CustomHeader";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchWithAuth } from "../../utility/fetchWithAuth";

type Spot = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export default function Global() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [spots, setSpots] = useState<Spot[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingCoord, setPendingCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [spotName, setSpotName] = useState("");
  const [spotDescription, setSpotDescription] = useState("");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      try {
        const response = await fetchWithAuth("/spots");
        const data = await response.json();
        setSpots(data);
      } catch (e) {
        setError("Failed to load spots");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // handler for long press on map
  const handleMapLongPress = (e: any) => {
    setPendingCoord(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const handleSubmitSpot = async () => {
    if (!spotName.trim()) {
      Alert.alert("Name is required");
      return;
    }

    try {
      const response = await fetchWithAuth("/spots", {
        method: "POST",
        body: JSON.stringify({
          name: spotName,
          description: spotDescription,
          latitude: pendingCoord?.latitude,
          longitude: pendingCoord?.longitude,
        }),
      });

      console.log("response status:", response.status);
      const newSpot = await response.json();
      console.log("new spot:", newSpot);
      setSpots((prev) => [...prev, newSpot]);
      setModalVisible(false);
      setSpotName("");
      setSpotDescription("");
      setPendingCoord(null);
    } catch (err) {
      console.log("error:", err);
      Alert.alert("Failed to add spot");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader
        title="map"
        rightIconName="information-circle"
        onRightIconPress={() => null}
      />
      <View style={styles.mainContainer}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        )}
        {error ? (
          <View style={styles.centered}>
            <Text>{error}</Text>
          </View>
        ) : null}
        {!loading && !error && location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation
            onLongPress={handleMapLongPress}
          >
            {spots.map((spot) => (
              <Marker
                key={String(spot.id)}
                coordinate={{
                  latitude: spot.latitude,
                  longitude: spot.longitude,
                }}
                onPress={() => {
                  setSelectedSpot(spot);
                  setDetailModalVisible(true);
                }}
              />
            ))}
          </MapView>
        )}

        {/* ── Spot Detail Modal ── */}
        <Modal visible={detailModalVisible} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.detailModalContent}
            >
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header row */}
              <View style={styles.detailHeader}>
                <View style={styles.detailPinBadge}>
                  <Text style={styles.detailPinIcon}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{selectedSpot?.name}</Text>
                  <Text style={styles.detailSubtitle}>User-submitted spot</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Description */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionLabel}>DESCRIPTION</Text>
                <Text style={styles.detailSectionValue}>
                  {selectedSpot?.description?.trim()
                    ? selectedSpot.description
                    : "No description provided."}
                </Text>
              </View>

              {/* Coordinates */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionLabel}>COORDINATES</Text>
                <View style={styles.coordRow}>
                  <View style={styles.coordPill}>
                    <Text style={styles.coordPillLabel}>LAT</Text>
                    <Text style={styles.coordPillValue}>
                      {parseFloat(String(selectedSpot?.latitude)).toFixed(5)}
                    </Text>
                  </View>
                  <View style={styles.coordPill}>
                    <Text style={styles.coordPillLabel}>LNG</Text>
                    <Text style={styles.coordPillValue}>
                      {parseFloat(String(selectedSpot?.longitude)).toFixed(5)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.actionButtonSecondaryText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonPrimary}>
                  <Text style={styles.actionButtonPrimaryText}>Go Here</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ── Add Spot Modal ── */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Spot</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={spotName}
                  onChangeText={setSpotName}
                  placeholderTextColor={"grey"}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description (optional)"
                  value={spotDescription}
                  onChangeText={setSpotDescription}
                  placeholderTextColor={"grey"}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSubmitSpot}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Shared overlay ──
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  // ── Add Spot modal (original, unchanged) ──
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelText: {
    textAlign: "center",
    color: "#888",
  },

  // ── Spot Detail modal ──
  detailModalContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  detailPinBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  detailPinIcon: {
    fontSize: 22,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    lineHeight: 24,
  },
  detailSubtitle: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
    gap: 8,
  },
  detailSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1,
  },
  detailSectionValue: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  coordRow: {
    flexDirection: "row",
    gap: 10,
  },
  coordPill: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  coordPillLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.8,
  },
  coordPillValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    fontVariant: ["tabular-nums"],
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionButtonSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  actionButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  actionButtonPrimary: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
  },
  actionButtonPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
