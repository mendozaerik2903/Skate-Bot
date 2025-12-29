import { trickOptions } from '@/constants/trick-options';
import { AttemptResults, typeMap } from '@/constants/types';
import { simplifyTrickName } from '@/utility/trick-manipulator';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import FilterButtons from './FilterButtons';
import SegmentedControl from './SegmentedControl';
import TrickResponse from './TrickResponse';

interface TrickBuilderProps {
  turnSuccess: (result: AttemptResults) => void;
}

export default function TrickBuilder({ turnSuccess }: TrickBuilderProps) {
  const trickTypes = ['shuvits', 'flips', 'heels'];
  const [selectedType, setSelectedType] = useState<string[]>([]);

  const [stance, setStance] = useState('regular');
  const [direction, setDirection] = useState('');
  const [modifier, setModifier] = useState('');
  const [trick, setTrick] = useState('ollie');

  const selectedTrickObj = trickOptions.find(t => t.value === trick);
  const validModifiers = selectedTrickObj?.modifiers ?? [];

  const filteredTrickOptions = trickOptions.filter(option => {
    if (selectedType.length === 0) return true;
    return selectedType.some(type => typeMap[type] === option.type);
  })

  useEffect(() => {
    if (!validModifiers.includes(modifier)) {
      setModifier('');
    }
    if (selectedTrickObj?.noDegrees === false) {
      setDirection('');
    } 
    if (selectedTrickObj?.noDegrees === true) {
      setDirection('BS');
    }
  }, [trick]);

  

  const finalTrick = simplifyTrickName([stance, modifier, direction, trick]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You're attempting:</Text>
      <Text style={styles.trick}>{finalTrick}</Text>
      <View style={{marginBottom: 10}}>
        <TrickResponse
          onLanded={() => {
            turnSuccess({ offense: true, trick: finalTrick, landed: true });
          }}
          onMissed={() => {
            turnSuccess({ offense: true, landed: false });
          }}
        />
      </View>
      
      
      {/* Row 1: Stance */}
      <SegmentedControl
        options={["regular", "fakie", "nollie", "switch"]}
        selected={stance}
        onSelect={setStance}
        strict
      />

      {/* Row 2: Direction/Rotation */}
      {!selectedTrickObj?.noDegrees ? (
        <SegmentedControl
          options={["FS 180", "BS 180", "FS 360", "BS 360"]}
          selected={direction}
          onSelect={setDirection}
        />
        ) : (
        <SegmentedControl
          options={["BS", "FS"]}
          selected={direction}
          onSelect={setDirection}
          strict
        />
      )}      

      {/* Row 3: main trick */}

      <FilterButtons
        options={trickTypes}
        selected={selectedType}
        onSelect={setSelectedType}
      />
      <FlatList
        data={filteredTrickOptions}
        keyExtractor={(item) => item.value}
        showsVerticalScrollIndicator={false}
        style={styles.picker}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setTrick(item.value)}
            style={[
              styles.item,
              trick === item.value && styles.selectedItem,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                trick === item.value && styles.selectedText,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />


      {/* Row 4: Modifier */}
      {validModifiers.length > 0 && (
        <SegmentedControl
          options={validModifiers}
          selected={modifier}
          onSelect={setModifier}
        />
      )}
      
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingInline: 10,
    backgroundColor: '#FFF',
  },
  pickerGroup: {
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    marginTop: 0,
  },
  text: {
    fontSize: 18,
    marginBottom: 0,
    textAlign: 'center',
  },
  trick: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E90FF',
    marginBottom: 0,
  },
  picker: {
    flex: 1,
    height: 200,
    width: '100%',
    color: 'black',
    overflow: 'hidden',
  },
    item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#007AFF20',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

