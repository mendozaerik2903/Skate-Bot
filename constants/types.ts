import { TrickComponents } from "./trick-options";

// Difficulty is now a continuous scalar in [0, 1], used directly as the
// land-rate multiplier in resolveGamePool(). Previously a 3-value union
// ("Easy" | "Medium" | "Hard") mapped through DIFFICULTY_SCALARS — replaced
// for slider support. The three labels now live as marker points in
// constants/difficulty.ts (DIFFICULTY_MARKERS) purely for display/snapping
// hints, not as a type.
export type Difficulty = number;

// Display-only label, derived from a Difficulty value via
// nearestDifficultyLabel() in constants/difficulty.ts. Not used for storage
// or routing — purely for UI hint text (e.g. slider "leaning Hard" label,
// TrickPoolSheet header).
export type DifficultyLabel = "Easy" | "Medium" | "Hard";

export type AttemptResults = {
  offense: boolean;
  trick?: string;
  trickComponents?: TrickComponents;
  landed: boolean;
  score?: number;
};

export type TrickHistoryEntry = {
  trick: string; // built via buildTrickName()
  performer: "user" | "bot";
  offense: boolean;
  landed: boolean;
  performerScore: number; // snapshot of performer's score at time of entry
  turn: number;
};
