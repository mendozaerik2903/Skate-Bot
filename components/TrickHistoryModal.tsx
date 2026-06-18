import TrickHistoryList from "@/components/TrickHistoryList";
import { TrickHistoryEntry } from "@/constants/types";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface TrickHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  history: TrickHistoryEntry[];
  username?: string;
  scoreWord: string;
}

export default function TrickHistoryModal({
  visible,
  onClose,
  history,
  username,
  scoreWord,
}: TrickHistoryModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Modal content */}
        <View style={styles.card}>
          <Text style={styles.title}>Trick History</Text>

          <View style={styles.listContainer}>
            <TrickHistoryList
              history={history}
              username={username}
              scoreWord={scoreWord}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  listContainer: {
    height: 400,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
