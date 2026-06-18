import { PersonaCard } from "@/utility/bot-builder";
import { buildBotPool } from "@/utility/pool-builder";
import {
  boostTricks,
  filterByStances,
  filterByTrickRotations,
  filterByTricks,
} from "@/utility/pool-filters";

export const BOT_PERSONAS: PersonaCard[] = [
  {
    id: "basic-bob",
    type: "persona",
    name: "Basic Bob",
    styleDescription:
      "Basic flatground tricks from beginner to entry-level intermediate.",
    poolFilter: (master) =>
      boostTricks(
        buildBotPool(
          filterByTrickRotations(
            filterByStances(
              filterByTricks(master, [
                "ollie",
                "shuvit",
                "kickflip",
                "heelflip",
                "360 shuvit",
                "varial flip",
                "varial heel",
                "bigspin",
              ]),
              ["regular", "fakie"],
            ),
            {
              ollie: ["BS 180", "FS 180"],
              kickflip: [],
              heelflip: [],
            },
          ),
        ),
        {
          ollie: { pickRate: 2.5 },
          shuvit: { pickRate: 2.0 },
          kickflip: { pickRate: 2.5 },
          heelflip: { pickRate: 2.0 },
        },
      ),
  },
  {
    // Shuvit Steve: shuvit family boosted heavily, but can throw
    // a kickflip or ollie occasionally like any real skater
    id: "shuvit-steve",
    type: "persona",
    name: "Shuvit Steve",
    styleDescription: "Spins everything. Flip tricks are an afterthought.",
    poolFilter: (master) =>
      boostTricks(buildBotPool(master), {
        shuvit: { pickRate: 4.0 },
        "360 shuvit": { pickRate: 4.0 },
        bigspin: { pickRate: 3.5 },
        biggerspin: { pickRate: 3.0 },
        "540 shuvit": { pickRate: 2.5 },
        "gazelle spin": { pickRate: 2.0 },
      }),
  },
];
