import CustomHeader from "@/components/CustomHeader";
import CustomModal from "@/components/CustomModal";
import DiceConfigurator from "@/components/DiceConfigurator";
import InfoButton from "@/components/InfoButton";
import SegmentedControl from "@/components/SegmentedControl";
import DESCRIPTIONS from "@/constants/descriptions";
import { Difficulty } from "@/constants/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [gamemode, setGamemode] = useState("SKATE");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [scoreWord, setScoreWord] = useState<string>("SK8");
  const [infoText, setInfoText] = useState("");

  const handleStart = () => {
    if (gamemode === "SKATE") {
      router.push({
        pathname: '/botbattle/pregame',
        params: {
          difficulty, scoreWord
        },
      });
    } else if (gamemode === "Dice") {
        router.push({
        pathname: '/botbattle/dice',
        params: {
          
        },
      });
    }
  }

  useEffect(() => {
    if (gamemode === "SKATE") {
      setInfoText(DESCRIPTIONS.skateMode);
    } else if (gamemode === "Dice") {
      setInfoText(DESCRIPTIONS.diceMode);
    }
  }, [gamemode]);


  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="skate bot" />
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Rules"
      >
        <Text>{infoText}</Text>
      </CustomModal>

      <View style={styles.mainContainer}>
        <View style={styles.modeContainer}>
          <SegmentedControl
          options={["SKATE", "Dice"]}
          selected={gamemode}
          onSelect={setGamemode}
          />
          <InfoButton onPress={() => setModalVisible(true)} style={styles.infoButton}/>
        </View>
        
        <View style={styles.optionsContainer}>
          {/* only shows if SKATE gamemode is selected */}
          { gamemode === "SKATE" && (
            <>
              <Text>Difficulty</Text>
              <SegmentedControl
                options={["Easy", "Medium", "Hard"]}
                selected={difficulty}
                onSelect={(value) => setDifficulty(value as Difficulty)}
              />

              <Text>Length of game</Text>
              <SegmentedControl
                options={["SK8", "SKATE", "SKATEBOARD"]}
                selected={scoreWord}
                onSelect={setScoreWord}
              />
            </>
          )}

          {/* only shows if Dice gamemode is selected */}
          { gamemode === "Dice" && (
            <>
              <Text>Customize your dice</Text>
              <DiceConfigurator/>
            </>
          )}
        </View>

        
      </View>
      <TouchableOpacity style={styles.skateButton} onPress={handleStart}>
        <Text style={styles.skateButtonText}>Start</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    //justifyContent: "space-between",
    alignItems: "center",
  },
  modeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 12,
  },

  optionsContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    //justifyContent: "space-between",
    alignItems: "center",
  },
  skateButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
  },
  skateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoButton: {
    paddingLeft: 5
  },
})