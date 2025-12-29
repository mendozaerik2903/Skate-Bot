// components/MatchDisplay.js
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const getBotIcon = (status: any) => {
  switch (status) {
    case 'happy':
      return 'robot-happy-outline';
    case 'angry':
      return 'robot-angry-outline';
    case 'defeat':
      return 'robot-dead-outline';
    case 'neutral':
    default:
      return 'robot-outline';
  }
};

const getUserIcon = (status: any) => {
  switch (status) {
    case 'happy':
      return 'grin-beam';
    case 'angry':
      return 'angry';
    case 'defeat':
      return 'sad-cry';
    case 'neutral':
    default:
      return 'meh';
  }
};


export default function MatchDisplay({
  botStatus = 'neutral',
  botLetters = '',
  botScore = 0,
  userStatus = 'neutral',
  userLetters = '',
  userScore = 0,
  offense = 'bot', // 'bot' or 'user'
  scoreWord = '', // fallback
}) {
  const renderLetters = (lettersCount: number) => {
    return scoreWord.split('').map((char, index) => (
      <Text
        key={index}
        style={[
          styles.letter,
          index < lettersCount && styles.lostLetter, // bold or colored if lost
        ]}
      >
        {char}
      </Text>
    ));
  };


  return (
    <View style={styles.container}>
      {/* Bot Side */}
      <View style={styles.playerContainer}>
        <Text style={styles.role}>
          {offense === 'bot' ? 'Offense' : 
          offense === 'user' ? 'Defense' : ''}
        </Text>
        <MaterialCommunityIcons
          name={getBotIcon(botStatus)}
          size={40}
          color="black"
        />
        
        <Text style={styles.label}>Bot</Text>
        <View style={styles.lettersRow}>{renderLetters(botScore)}</View>
      </View>

      {/* VS Text */}

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>vs</Text>
      </View>

      {/* User Side */}
      <View style={styles.playerContainer}>
        <Text style={styles.role}>
          {offense === 'user' ? 'Offense' : 
          offense === 'bot' ? 'Defense' : ''}
        </Text>
        <FontAwesome5 
          name={getUserIcon(userStatus)} 
          size={36} 
          color="black" 
        />
        <Text style={styles.label}>You</Text>
        <View style={styles.lettersRow}>{renderLetters(userScore)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginTop: 4,
  },
  letters: {
    fontSize: 16,
    marginTop: 2,
    color: '#333',
  },
  role: {
    marginTop: 4,
    fontSize: 12,
    color: '#1E90FF',
  },
  vsContainer: {
    width: 40,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
    lettersRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  letter: {
    fontSize: 18,
    marginHorizontal: 0,
    color: '#333',
  },
  lostLetter: {
    fontWeight: 'bold',
    color: 'red', // highlight missed letters
  },
});
