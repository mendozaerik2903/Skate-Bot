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
    <SafeAreaView style={styles.container}>
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

        <Modal visible={detailModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setDetailModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedSpot?.name}</Text>
              {selectedSpot?.description ? (
                <Text style={styles.detailDescription}>
                  {selectedSpot.description}
                </Text>
              ) : null}
              <Text style={styles.detailCoords}>
                {selectedSpot?.latitude}, {selectedSpot?.longitude}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
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
  detailDescription: {
    fontSize: 14,
    color: "#444",
  },
  detailCoords: {
    fontSize: 12,
    color: "#aaa",
  },
});
