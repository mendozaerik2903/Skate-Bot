import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface TrickResponseProps {
  onLanded: () => void;
  onMissed: () => void;
  style?: ViewStyle;
}

export default function TrickResponse({ onLanded, onMissed, style }: TrickResponseProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onLanded} style={styles.landedButton}>
        <Text style={styles.buttonText}>Landed</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onMissed} style={styles.missedButton}>
        <Text style={styles.buttonText}>Missed</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    gap: 96,
  },
  landedButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
  },
  missedButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FF4C4C',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
