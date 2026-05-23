import { TrickComponents } from "./trick-options";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type AttemptResults = {
  offense: boolean;
  trick?: string;
  trickComponents?: TrickComponents;
  landed: boolean;
  score?: number;
};
