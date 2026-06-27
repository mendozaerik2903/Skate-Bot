import { DifficultyLabel } from "@/constants/types";

// ---------------------------------------------------------------------------
// Difficulty is a continuous scalar in [0, 1], applied directly to landRate
// in resolveGamePool() (see utility/bot-builder.ts). This replaces the old
// fixed DIFFICULTY_SCALARS lookup keyed by the Easy/Medium/Hard union.
//
// DIFFICULTY_MARKERS preserves the exact values the old lookup used, now as
// slider marker/snap points and as the basis for the nearest-label hint
// shown while dragging.
// ---------------------------------------------------------------------------

export const DIFFICULTY_MARKERS: Record<DifficultyLabel, number> = {
  Easy: 0.15,
  Medium: 0.45,
  Hard: 0.85,
};

export const DIFFICULTY_MIN = 0.15;
export const DIFFICULTY_MAX = 1;

// Default slider value on first mount (mirrors the old default of "Medium").
export const DEFAULT_DIFFICULTY_VALUE = DIFFICULTY_MARKERS.Medium;

// Find the closest label for a given continuous value — used for the
// "leaning Hard" style hint while dragging, and for TrickPoolSheet's header.
export function nearestDifficultyLabel(value: number): DifficultyLabel {
  let closest: DifficultyLabel = "Easy";
  let closestDist = Infinity;
  for (const label of Object.keys(DIFFICULTY_MARKERS) as DifficultyLabel[]) {
    const dist = Math.abs(DIFFICULTY_MARKERS[label] - value);
    if (dist < closestDist) {
      closestDist = dist;
      closest = label;
    }
  }
  return closest;
}

// ---------------------------------------------------------------------------
// 5-stop color scale: bright blue (easiest) through deep purple (hardest).
// Replaces the original green→yellow→orange→red scale, which fought the
// app's blue brand color and had a low-contrast yellow/light-green midpoint.
//
// Deliberately does NOT end in black — a hue-based scale that converges to
// black loses its ability to distinguish "deep blue" from "deep purple" right
// where that distinction matters most (the hardest tricks). Every stop here
// stays bright/saturated enough to keep hue doing the work end-to-end.
// ---------------------------------------------------------------------------

const COLOR_STOPS: { stop: number; color: [number, number, number] }[] = [
  { stop: 0.0, color: [0, 192, 255] }, // #00c0ff
  { stop: 0.25, color: [99, 171, 255] }, // #0070FF
  { stop: 0.5, color: [107, 137, 255] }, // #5A00F0
  { stop: 0.75, color: [122, 123, 255] }, // #7E00DC
  { stop: 1.0, color: [154, 95, 255] }, // #9B00C8
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function toHex(n: number): string {
  return Math.round(n).toString(16).padStart(2, "0");
}

/**
 * Maps a value in [0, 1] to a hex color along the 5-stop blue→purple scale.
 * 0 = easiest (bright blue), 1 = hardest (deep purple).
 */
export function difficultyScaleColor(value: number): string {
  const v = Math.min(1, Math.max(0, value));

  let lower = COLOR_STOPS[0];
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (v >= COLOR_STOPS[i].stop && v <= COLOR_STOPS[i + 1].stop) {
      lower = COLOR_STOPS[i];
      upper = COLOR_STOPS[i + 1];
      break;
    }
  }

  const range = upper.stop - lower.stop || 1;
  const t = (v - lower.stop) / range;

  const r = lerp(lower.color[0], upper.color[0], t);
  const g = lerp(lower.color[1], upper.color[1], t);
  const b = lerp(lower.color[2], upper.color[2], t);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// landRate uses the inverse sense of the difficulty scale: a HIGH landRate
// (likely to land) should read as "easy"/blue, a LOW landRate (likely to
// miss) should read as "hard"/purple. difficultyScaleColor expects 0=blue,
// 1=purple, so callers displaying a landRate pass (1 - landRate).
// ---------------------------------------------------------------------------

export function landRateScaleColor(landRate: number): string {
  return difficultyScaleColor(1 - landRate);
}
