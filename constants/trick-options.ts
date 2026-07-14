export interface TrickOption {
  label: string;
  value: string;
  type: TrickType;
  rotations: Rotation[];
  modifiers: Modifier[];
}

export type TrickComponents = {
  stance: Stance; // 'regular' | 'fakie' | 'nollie' | 'switch'
  rotation: Rotation; // 'bs' | 'fs' | 'bs 180' | ''
  trick: string; // 'ollie' | 'kickflip' | 'shuvit'
  modifier: Modifier; // 'body varial' | 'revert' | 'late' | ''
  fullName: string;
};

export const stanceOptions = ["regular", "fakie", "nollie", "switch"] as const;
export type Stance = (typeof stanceOptions)[number];

export const trickTypeOptions = ["shuvit", "flip", "heel", "other"] as const;
export type TrickType = (typeof trickTypeOptions)[number];

export const rotationOptions = [
  "BS",
  "FS",
  "BS 180",
  "FS 180",
  "BS 360",
  "FS 360",
  "",
] as const;
export type Rotation = (typeof rotationOptions)[number];

export const modifierOptions = [
  "late",
  "pressure",
  "body varial",
  "revert",
  "front foot",
  "",
] as const;
export type Modifier = (typeof modifierOptions)[number];

export const trickOptions: TrickOption[] = [
  {
    label: "Ollie",
    value: "ollie",
    type: "other",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//"body varial"],
  },

  {
    label: "Shuvit",
    value: "shuvit",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Kickflip",
    value: "kickflip",
    type: "flip",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial"],
  },

  {
    label: "Heelflip",
    value: "heelflip",
    type: "heel",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial"],
  },

  {
    label: "360 Shuvit",
    value: "360 shuvit",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Bigspin",
    value: "bigspin",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["late", "body varial"],
  },

  {
    label: "Varial Flip",
    value: "varial flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["late", "pressure", "body varial", "revert"],
  },

  {
    label: "Varial Heel",
    value: "varial heel",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["late", "pressure", "body varial", "revert"],
  },

  {
    label: "Tre Flip",
    value: "tre flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["pressure", "body varial", "revert"],
  },

  {
    label: "Laser Flip",
    value: "laser flip",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["pressure", "body varial", "revert"],
  },

  {
    label: "Hardflip",
    value: "hardflip",
    type: "flip",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial", "revert"],
  },

  {
    label: "Inward Heel",
    value: "inward heel",
    type: "heel",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial", "revert"],
  },

  {
    label: "Impossible",
    value: "impossible",
    type: "shuvit",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["front foot"],
  },

  {
    label: "Big Flip",
    value: "big flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["revert"],
  },

  {
    label: "Big Heel",
    value: "big heel",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["revert"],
  },

  {
    label: "Dolphin Flip",
    value: "dolphin flip",
    type: "flip",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Dolphin Heel",
    value: "dolphin heel",
    type: "heel",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Hospital Flip",
    value: "hospital flip",
    type: "flip",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Hospital Heel",
    value: "hospital heel",
    type: "heel",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "body varial", "revert"],
  },

  {
    label: "Double Kickflip",
    value: "double kickflip",
    type: "flip",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial"],
  },

  {
    label: "Double Heelflip",
    value: "double heelflip",
    type: "heel",
    rotations: ["BS 180", "FS 180", "BS 360", "FS 360"],
    modifiers: []//["late", "pressure", "body varial"],
  },

  {
    label: "Biggerspin",
    value: "biggerspin",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["revert"],
  },

  {
    label: "Bigger Flip",
    value: "bigger flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["revert"],
  },

  {
    label: "Bigger Heel",
    value: "bigger heel",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["revert"],
  },

  {
    label: "540 Shuvit",
    value: "540 shuvit",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["body varial", "revert"],
  },

  {
    label: "540 Flip",
    value: "540 flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["revert"],
  },

  {
    label: "540 Heel",
    value: "540 heel",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["revert"],
  },

  {
    label: "Gazelle Spin",
    value: "gazelle spin",
    type: "shuvit",
    rotations: ["BS", "FS"],
    modifiers: []//["revert"],
  },

  {
    label: "Gazelle Flip",
    value: "gazelle flip",
    type: "flip",
    rotations: ["BS"],
    modifiers: []//["revert"],
  },

  {
    label: "Gazelle Heel",
    value: "gazelle heel",
    type: "heel",
    rotations: ["FS"],
    modifiers: []//["revert"],
  },
];
// common words: shuvit, flip, heel, spin, 180, 360, 540
