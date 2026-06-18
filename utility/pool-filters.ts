// ---------------------------------------------------------------------------
// Pool filter helpers
// Persona identity is encoded as a filter on MASTER_BOT_TRICKS, not as
// a manually curated name list. Add new personas by composing these helpers.
// ---------------------------------------------------------------------------

import { BotTrickData, BotTrickSet } from "@/constants/bot-tricks";
import { trickOptions, TrickType } from "@/constants/trick-options";
import { BotTrickEntry } from "./pool-builder";

export function filterByTricks(
  tricks: BotTrickSet,
  allowedTrickNames: string[],
): BotTrickSet {
  return Object.fromEntries(
    Object.entries(tricks).filter(([name]) => allowedTrickNames.includes(name)),
  );
}

export function filterByType(
  tricks: BotTrickSet,
  allowedTypes: TrickType[],
): BotTrickSet {
  const allowedNames = trickOptions
    .filter((t) => allowedTypes.includes(t.type))
    .map((t) => t.value);
  return filterByTricks(tricks, allowedNames);
}

export function filterByStances(
  tricks: BotTrickSet,
  allowedStances: Array<keyof BotTrickSet[string]["stanceRates"]>,
): BotTrickSet {
  return Object.fromEntries(
    Object.entries(tricks).map(([name, data]) => [
      name,
      {
        ...data,
        stanceRates: Object.fromEntries(
          Object.entries(data.stanceRates).filter(([stance]) =>
            allowedStances.includes(stance as any),
          ),
        ),
      },
    ]),
  );
}

// Filter specific tricks to only specific stances per trick.
// trickStanceMap: { "kickflip": ["regular", "switch"], "heelflip": ["fakie"] }
// Tricks not in the map are included with all their stances unchanged.
// Tricks in the map with an empty stance array are excluded entirely.
export function filterByTrickStances(
  tricks: BotTrickSet,
  trickStanceMap: Record<string, Array<keyof BotTrickData["stanceRates"]>>,
): BotTrickSet {
  return Object.fromEntries(
    Object.entries(tricks)
      .filter(([name]) => {
        // If trick is in the map with empty stances, exclude it
        const allowedStances = trickStanceMap[name];
        return !(allowedStances && allowedStances.length === 0);
      })
      .map(([name, data]) => {
        const allowedStances = trickStanceMap[name];
        // Trick not in map — include with all stances unchanged
        if (!allowedStances) return [name, data];
        // Trick in map — filter to allowed stances only
        return [
          name,
          {
            ...data,
            stanceRates: Object.fromEntries(
              Object.entries(data.stanceRates).filter(([stance]) =>
                allowedStances.includes(stance as any),
              ),
            ),
          },
        ];
      }),
  );
}

// Filter specific tricks to only specific rotations per trick.
// trickRotationMap: { "ollie": ["BS 180", "FS 180"], "kickflip": ["BS 180"] }
// Tricks not in the map are included with all their rotations unchanged.
// Tricks in the map with an empty array are included but have ALL rotations stripped
// (i.e. they can only be thrown clean, no rotation).
export function filterByTrickRotations(
  tricks: BotTrickSet,
  trickRotationMap: Record<
    string,
    Array<keyof BotTrickData["rotationModifiers"]>
  >,
): BotTrickSet {
  return Object.fromEntries(
    Object.entries(tricks).map(([name, data]) => {
      const allowedRotations = trickRotationMap[name];
      // Trick not in map — include with all rotations unchanged
      if (!allowedRotations) return [name, data];
      // Trick in map — filter to allowed rotations only (empty array = no rotations)
      return [
        name,
        {
          ...data,
          rotationModifiers: Object.fromEntries(
            Object.entries(data.rotationModifiers).filter(([rotation]) =>
              allowedRotations.includes(rotation as any),
            ),
          ),
        },
      ];
    }),
  );
}

// Boost pickRate and/or landRate for specific tricks independently.
//
// pickRate: multiplier applied to sampleWeight — affects how often the trick
//           is selected. baseStanceRate is never touched so displayed
//           percentages stay accurate.
// landRate: multiplier applied to landRate — affects how often the trick
//           is successfully landed. Use sparingly; this makes a persona
//           genuinely better at a trick, not just more likely to attempt it.
//
// boostMap: { "gazelle flip": { pickRate: 3.0, landRate: 1.2 } }
//           { "tre flip": { pickRate: 2.5 } }   // pick rate only
//           { "kickflip": { landRate: 1.15 } }  // land rate only
//
// Operates on a BotTrickEntry[] after buildBotPool has run.
export function boostTricks(
  pool: BotTrickEntry[],
  boostMap: Record<string, { pickRate?: number; landRate?: number }>,
): BotTrickEntry[] {
  return pool.map((entry) => {
    const boost = boostMap[entry.trick];
    if (!boost) return entry;
    return {
      ...entry,
      ...(boost.pickRate !== undefined && {
        sampleWeight: entry.sampleWeight * boost.pickRate,
      }),
      ...(boost.landRate !== undefined && {
        landRate: entry.landRate * boost.landRate,
      }),
    };
  });
}
