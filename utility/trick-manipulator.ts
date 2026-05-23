import { TrickComponents } from "@/constants/trick-options";

const TRAILING_MODIFIERS = ["body varial", "revert"];

export function buildTrickName(c: TrickComponents): string {
  const stance = c.stance.toLowerCase().trim();
  const rotation = c.rotation.toLowerCase().trim();
  const trick = c.trick.toLowerCase().trim();
  const modifier = c.modifier.toLowerCase().trim();

  // "nollie ollie" with no other modifiers -> just "nollie"
  if (trick === "ollie" && stance === "nollie" && !rotation) {
    return "nollie";
  }

  // Any ollie with a rotation modifier drops the word "ollie"
  // e.g. "switch bs 180 ollie" -> "switch bs 180"
  if (trick === "ollie" && rotation) {
    return [stance !== "regular" ? stance : "", rotation]
      .filter(Boolean)
      .join(" ");
  }

  // Standard assembly: stance -> rotation -> rotation -> trick -> trailing modifier
  const isTrailing = TRAILING_MODIFIERS.includes(modifier);

  const parts = [stance !== "regular" ? stance : "", rotation, trick].filter(
    Boolean,
  );

  // Trailing modifiers (body varial, revert) go after the trick name
  if (modifier && isTrailing) {
    parts.push(modifier);
  }

  // Leading modifiers (late, pressure, front foot) go before the trick name
  if (modifier && !isTrailing) {
    const trickIndex = parts.indexOf(trick);
    parts.splice(trickIndex, 0, modifier);
  }

  return parts.join(" ");
}
