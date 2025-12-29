import TimerBar from '@/components/TimerBar';
import { AttemptResults, Difficulty } from '@/constants/types';
import { attemptDefenseTrick } from '@/utility/bot-defense';
import { botOffenseTurn } from '@/utility/bot-offense';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import TrickResponse from './TrickResponse';

interface BotResponseProps {
  scoreWord: string;
  difficulty: Difficulty;
  currentOffense: string;
  userTrick?: string;
  botResult: (result: AttemptResults) => void;
  userResult: (result: AttemptResults) => void;
  botScore: number;
  userScore: number;
}

export default function BotResponse({ scoreWord, difficulty, currentOffense, userTrick, botResult, userResult, botScore, userScore}: BotResponseProps) {
  const [selectedTrick, setSelectedTrick] = useState<string>("");
  const [landedTrick, setLandedTrick] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [turns, setTurns] = useState(0);
  const [isRedemption, setIsRedepmtion] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (currentOffense === "bot" && landedTrick === false) {
      const timeout = setTimeout(() => {
        const turn = botOffenseTurn(difficulty);
        setSelectedTrick(turn.botOffenseTrick);
        setLandedTrick(turn.botOffenseSuccess);
        setIsLoading(false);
        
        const resultDelay = setTimeout(() => {
          botResult({ offense: true, trick: turn.botOffenseTrick, landed: turn.botOffenseSuccess, score: botScore});
        }, 2000);
        return () => clearTimeout(resultDelay); 

      }, 1800);
      return () => clearTimeout(timeout);
    }
    
    if (currentOffense === "user" && userTrick) {
      const timeout = setTimeout(() => {
        const botDefenseSuccess = attemptDefenseTrick(difficulty, userTrick);
        setSelectedTrick(userTrick);
        setLandedTrick(botDefenseSuccess);
        setIsLoading(false);

        const resultDelay = setTimeout(() => {      
          botResult({ offense: false, trick: selectedTrick, landed: botDefenseSuccess, score: botScore});
        }, 2000);
        return () => clearTimeout(resultDelay); 

      }, 1800);
      return () => clearTimeout(timeout);
    }
    setIsLoading(false);
  }, [turns]); // Rerun Bot based on these variables changing.



  return (
    <View style={styles.container}>
      {isLoading ? (
        <View>
          <Text style={styles.text}>
            {currentOffense === "bot" ? "🤖 Bot is picking a trick..." 
            : `Bot is attempting your ${userTrick}`
            }
          </Text>
          <ActivityIndicator size="large" color="#1E90FF" />
        </View>
      ) : (
        <View>
          <Text style={styles.text}>Bot {landedTrick ? "landed" : "missed"} a:</Text>
          <Text style={styles.trick}>{selectedTrick}</Text>
          <TimerBar
            duration={2000}
            style={{marginTop: 10}}
          />
        {landedTrick && currentOffense === "bot" && (
          <View>
            <Text style={styles.text}>
              {isRedemption ? "Second chance to land this trick!" : "Were you able to replicate this trick?"}
            </Text>
            
            <TrickResponse
              onLanded={() => {
                userResult({ offense: false, trick: selectedTrick, landed: true, score: userScore})
                setIsRedepmtion(false);
                setLandedTrick(false);
                setSelectedTrick("");
                setTurns(turns + 1);
              }}
              onMissed={() => {
                if (scoreWord.length - 1 === userScore && isRedemption === false) {
                  setIsRedepmtion(true);
                } else {
                  userResult({ offense: false, trick: selectedTrick, landed: false, score: userScore})
                  setLandedTrick(false);
                  setSelectedTrick("");
                  setTurns(turns + 1);
                }
              }}
            />

          </View>
        )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  trick: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E90FF',
    marginBottom: 12,
  },
  defenseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1E90FF', // default blue
    marginHorizontal: 8,
    alignItems: 'center',
  },
  defenseButtonMissed: {
    backgroundColor: '#FF4C4C',
  },
  defenseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingBar: {
    height: 4,
    backgroundColor: '#1E90FF',
    alignSelf: 'stretch',
    marginTop: 12,
    borderRadius: 2,
  },
});
