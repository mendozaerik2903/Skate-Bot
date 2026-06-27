import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const TRAVEL_DISTANCE = 300; // how far the board rolls, in px
const ROLL_DURATION = 900; // ms for one direction
const PAUSE_DURATION = 400; // ms paused at each end

export default function RollingSkateboard() {
  const translateX = useSharedValue(0);
  const wheelSpin = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        // Pause at the left before rolling right
        withDelay(
          PAUSE_DURATION,
          withTiming(TRAVEL_DISTANCE, {
            duration: ROLL_DURATION,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        // Pause at the right before rolling back
        withDelay(
          PAUSE_DURATION,
          withTiming(0, {
            duration: ROLL_DURATION,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
      ),
      -1,
      false, // don't reverse the sequence automatically — withRepeat just restarts it
    );

    // Wheels spin continuously while rolling — kept simple (constant speed)
    // rather than synced to direction/pause, since the visual difference
    // at this size is negligible.
    wheelSpin.value = withRepeat(
      withTiming(360, { duration: 500, easing: Easing.linear }),
      -1,
    );
  }, []);

  const boardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelSpin.value}deg` }],
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.board, boardStyle]}>
        <View style={styles.deck} />
        <View style={styles.trucks}>
          <Animated.View style={[styles.wheel, wheelStyle]} />
          <Animated.View style={[styles.wheel, wheelStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 44,
    width: TRAVEL_DISTANCE + 70, // travel distance + board width, fixed so it never depends on an ambiguous parent width
    overflow: "hidden",
  },
  board: {
    position: "absolute",
    top: 6,
    left: 0,
    width: 70,
    height: 22,
    alignItems: "center",
  },
  deck: {
    width: 70,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#1E90FF",
  },
  trucks: {
    width: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  wheel: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#222",
  },
});
