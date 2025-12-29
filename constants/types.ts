import { TrickOption } from "./trick-options";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Trick = string;
export type Stance = "regular" | "fakie" | "nollie" | "switch";

export type BotTrickSet = Record<Difficulty, Record<Trick, Partial<Record<Stance, number>>>>;

export const typeMap: Record<string, TrickOption["type"]> = {
  shuvits: 'shuvit',
  flips: 'flip',
  heels: 'heel',
  others: 'other',
};

export type AttemptResults = {
  offense: boolean;
  trick?: string;
  landed: boolean;
  score?: number;
}