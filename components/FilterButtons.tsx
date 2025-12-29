import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface FilterButtonsProps {
  options: string[];
  selected: string[];
  onSelect: (updated: string[]) => void;
}

export default function FilterButtons({ options, selected, onSelect }: FilterButtonsProps) {
  const toggleOption = (option: string) => {
    const isSelected = selected.includes(option);
    const updated = isSelected
      ? selected.filter(item => item !== option) // remove
      : [...selected, option]; // add

    onSelect(updated);
  };

  return (
    <View style={styles.container}>
      {options.map(option => {
        const isActive = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => toggleOption(option)}
            style={[
              styles.button,
              isActive && styles.selectedButton
            ]}
          >
            <Text style={[styles.text, isActive && styles.selectedText]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 0,
  },
  button: {
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 4,
  },
  selectedButton: {
    backgroundColor: '#1E90FF',
  },
  text: {
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  selectedText: {
    color: '#fff',
  },
});
