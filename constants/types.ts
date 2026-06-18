import { TrickComponents } from "./trick-options";

export type Difficulty = "Easy" | "Medium" | "Hard";

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
