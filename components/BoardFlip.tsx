import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Optional: uncomment if expo-haptics is installed
// import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOARD_WIDTH = SCREEN_WIDTH * 0.28;
const BOARD_HEIGHT = BOARD_WIDTH * 3.2;
const BOARD_RADIUS = BOARD_WIDTH * 0.18;

type Side = "grip" | "graphic";
type Player = 1 | 2;

interface BoardFlipProps {
  player1Name?: string;
  player2Name?: string;
  onResult?: (winner: Player, side: Side) => void;
}

// ─── Griptape Side ───────────────────────────────────────────────────────────
function GriptapeSide() {
  return (
    <View style={styles.boardFace}>
      {/* Griptape texture via dot grid */}
      <View style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: 18 }).map((_, row) => (
          <View key={row} style={styles.gripRow}>
            {Array.from({ length: 8 }).map((_, col) => (
              <View key={col} style={styles.gripDot} />
            ))}
          </View>
        ))}
      </View>

      {/* Nose concave line */}
      <View style={[styles.concaveLine, { top: BOARD_HEIGHT * 0.12 }]} />
      {/* Tail concave line */}
      <View style={[styles.concaveLine, { bottom: BOARD_HEIGHT * 0.12 }]} />

      {/* Truck bolt holes */}
      <View style={[styles.boltGroup, { top: BOARD_HEIGHT * 0.2 }]}>
        <View style={styles.bolt} />
        <View style={styles.bolt} />
        <View style={styles.bolt} />
        <View style={styles.bolt} />
      </View>
      <View style={[styles.boltGroup, { bottom: BOARD_HEIGHT * 0.2 }]}>
        <View style={styles.bolt} />
        <View style={styles.bolt} />
        <View style={styles.bolt} />
        <View style={styles.bolt} />
      </View>

      <Text style={styles.gripLabel}>GRIP</Text>
    </View>
  );
}

// ─── Graphic Side ─────────────────────────────────────────────────────────────
function GraphicSide() {
  return (
    <View style={[styles.boardFace, styles.graphicFace]}>
      {/* Background gradient-like layers */}
      <View style={styles.graphicBg1} />
      <View style={styles.graphicBg2} />

      {/* Skull / logo area */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoSkull}>☠</Text>
        <Text style={styles.logoText}>SKATE</Text>
        <Text style={styles.logoSub}>OR DIE</Text>
      </View>

      {/* Decorative stripe */}
      <View style={styles.stripe1} />
      <View style={styles.stripe2} />

      {/* Truck bolt holes */}
      <View style={[styles.boltGroup, { top: BOARD_HEIGHT * 0.2 }]}>
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
      </View>
      <View style={[styles.boltGroup, { bottom: BOARD_HEIGHT * 0.2 }]}>
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
        <View style={[styles.bolt, styles.boltGraphic]} />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BoardFlip({
  player1Name = "Player 1",
  player2Name = "Player 2",
  onResult,
}: BoardFlipProps) {
  const rotateX = useSharedValue(0);
  const [visibleSide, setVisibleSide] = useState<Side>("grip");
  const [result, setResult] = useState<{ winner: Player; side: Side } | null>(
    null,
  );
  const [flipping, setFlipping] = useState(false);
  const [phase, setPhase] = useState<"idle" | "flipping" | "done">("idle");
  const faceSwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFlipDone = useCallback(
    (winner: Player, side: Side) => {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setResult({ winner, side });
      setPhase("done");
      setFlipping(false);
      onResult?.(winner, side);
    },
    [onResult],
  );

  const swapFace = useCallback((side: Side) => {
    setVisibleSide(side);
  }, []);

  const flip = useCallback(() => {
    if (flipping) return;

    setFlipping(true);
    setPhase("flipping");
    setResult(null);

    const winningSide: Side = Math.random() > 0.5 ? "grip" : "graphic";
    const winner: Player = winningSide === "grip" ? 1 : 2;

    // Total rotation: 3 full spins + landing angle
    // grip = 0° offset (face up), graphic = 180° offset (face down)
    const totalSpins = 3 * 360;
    const landingOffset = winningSide === "grip" ? 0 : 180;
    const targetRotation = rotateX.value + totalSpins + landingOffset;

    // Swap the visible face just past the midpoint (when board is edge-on)
    const totalDuration = 1500;
    const swapAt = totalDuration * 0.52;

    if (faceSwapTimer.current) clearTimeout(faceSwapTimer.current);
    faceSwapTimer.current = setTimeout(() => {
      runOnJS(swapFace)(winningSide);
    }, swapAt);

    rotateX.value = withSequence(
      // Fast spin with ease-in
      withTiming(rotateX.value + totalSpins * 0.75, {
        duration: totalDuration * 0.55,
        easing: Easing.in(Easing.quad),
      }),
      // Springy settle into final position
      withSpring(
        targetRotation,
        {
          stiffness: 55,
          damping: 13,
          mass: 1.3,
          overshootClamping: false,
        },
        () => {
          runOnJS(handleFlipDone)(winner, winningSide);
        },
      ),
    );
  }, [flipping, rotateX, handleFlipDone, swapFace]);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setVisibleSide("grip");
    rotateX.value = 0;
  }, [rotateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${rotateX.value}deg` }],
  }));

  const winnerName = result?.winner === 1 ? player1Name : player2Name;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WHO GOES FIRST?</Text>
        <Text style={styles.subtitle}>Flip the board to decide</Text>
      </View>

      {/* Player labels */}
      <View style={styles.playerRow}>
        <View style={styles.playerTag}>
          <Text style={styles.playerTagLabel}>GRIP</Text>
          <Text style={styles.playerName}>{player1Name}</Text>
        </View>
        <Text style={styles.vsText}>VS</Text>
        <View style={styles.playerTag}>
          <Text style={styles.playerTagLabel}>GRAPHIC</Text>
          <Text style={styles.playerName}>{player2Name}</Text>
        </View>
      </View>

      {/* Board */}
      <View style={styles.boardContainer}>
        <Animated.View style={[styles.boardWrapper, animatedStyle]}>
          <View style={styles.boardShadow} />
          {visibleSide === "grip" ? <GriptapeSide /> : <GraphicSide />}
        </Animated.View>
      </View>

      {/* Result */}
      {phase === "done" && result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>
            {result.side === "grip" ? "🛹" : "🎨"}
          </Text>
          <Text style={styles.resultText}>{winnerName} goes first!</Text>
          <Text style={styles.resultSide}>
            Landed {result.side === "grip" ? "griptape" : "graphic"} up
          </Text>
        </View>
      )}

      {/* CTA */}
      <View style={styles.ctaArea}>
        {phase !== "done" ? (
          <Pressable
            style={({ pressed }) => [
              styles.flipButton,
              flipping && styles.flipButtonDisabled,
              pressed && !flipping && styles.flipButtonPressed,
            ]}
            onPress={flip}
            disabled={flipping}
          >
            <Text style={styles.flipButtonText}>
              {flipping ? "FLIPPING..." : "FLIP BOARD"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.flipButton, styles.resetButton]}
            onPress={reset}
          >
            <Text style={[styles.flipButtonText, styles.resetButtonText]}>
              FLIP AGAIN
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 56,
    paddingHorizontal: 24,
  },

  // Header
  header: { alignItems: "center", gap: 4 },
  title: {
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    fontSize: 28,
    letterSpacing: 6,
    color: "#f0f0f0",
  },
  subtitle: {
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "sans-serif",
    fontSize: 13,
    color: "#555",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Players
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  playerTag: { alignItems: "center", gap: 2 },
  playerTagLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: "#e8ff00",
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-medium",
  },
  playerName: {
    fontSize: 16,
    color: "#f0f0f0",
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium",
    letterSpacing: 1,
  },
  vsText: {
    fontSize: 18,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 4,
  },

  // Board
  boardContainer: {
    height: BOARD_HEIGHT + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  boardWrapper: {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    transform: [{ perspective: 900 }],
  },
  boardShadow: {
    position: "absolute",
    bottom: -12,
    left: 8,
    right: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(232,255,0,0.08)",
  },

  // Board face (shared)
  boardFace: {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    borderRadius: BOARD_RADIUS,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },

  // Griptape
  gripRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginVertical: 2,
  },
  gripDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  concaveLine: {
    position: "absolute",
    left: "15%",
    right: "15%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  gripLabel: {
    position: "absolute",
    fontSize: 10,
    letterSpacing: 4,
    color: "rgba(255,255,255,0.15)",
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
  },

  // Truck bolts (shared)
  boltGroup: {
    position: "absolute",
    flexDirection: "row",
    flexWrap: "wrap",
    width: BOARD_WIDTH * 0.55,
    gap: BOARD_WIDTH * 0.18,
    alignItems: "center",
    justifyContent: "center",
  },
  bolt: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  boltGraphic: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderColor: "rgba(255,255,255,0.15)",
  },

  // Graphic side
  graphicFace: {
    backgroundColor: "#0d0d1a",
  },
  graphicBg1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "#12001f",
    borderRadius: BOARD_RADIUS,
  },
  graphicBg2: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#1a0005",
    borderRadius: BOARD_RADIUS,
  },
  stripe1: {
    position: "absolute",
    top: "46%",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#e8ff00",
    opacity: 0.85,
  },
  stripe2: {
    position: "absolute",
    top: "49%",
    left: "20%",
    right: "20%",
    height: 1,
    backgroundColor: "#ff003c",
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: "center",
    gap: 0,
  },
  logoSkull: {
    fontSize: 32,
  },
  logoText: {
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 5,
    color: "#f0f0f0",
  },
  logoSub: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-medium",
    letterSpacing: 6,
    color: "#ff003c",
  },

  // Result
  resultContainer: {
    alignItems: "center",
    gap: 4,
  },
  resultEmoji: { fontSize: 32 },
  resultText: {
    fontSize: 22,
    color: "#e8ff00",
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 2,
  },
  resultSide: {
    fontSize: 13,
    color: "#555",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "sans-serif",
    textTransform: "uppercase",
  },

  // Button
  ctaArea: { width: "100%", alignItems: "center" },
  flipButton: {
    width: "80%",
    paddingVertical: 16,
    backgroundColor: "#e8ff00",
    borderRadius: 4,
    alignItems: "center",
  },
  flipButtonDisabled: {
    backgroundColor: "#2a2a2a",
  },
  flipButtonPressed: {
    backgroundColor: "#c8df00",
    transform: [{ scale: 0.97 }],
  },
  flipButtonText: {
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 4,
    color: "#0a0a0a",
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
  },
  resetButtonText: {
    color: "#555",
  },
});
