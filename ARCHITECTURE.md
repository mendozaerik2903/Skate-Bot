# Architecture of App System

---

## Utility/

### auth.ts

### bot-defense.ts

attemptDefenseTrick(difficulty: Difficulty, trick: Trick)

- Looks up the user's given trick wihtin its proper difficulty trick pool to determine a land rate.

### bot-offense.ts

getRandomItem<T>(array: T[]): T

- Generates a random number within a given array's length to retrieve a random item.

getRandomOffenseTrick(difficulty: Difficulty)

- Looks up its proper difficulty trick pool to determine a trick and its land rate. If the game has repeatable tricks then any trick is picked at random. Otherwise, tricks are picked based on the weight of their land rates.

attemptOffenseTrick(landRate: number)

- A random number is compared against the picked trick's land rate and returns boolean.

botOffenseTurn(difficulty: Difficulty)

- The final results of the bot's offense turn is returned as two outputs: the bot's attempted trick and the bot's success as a boolean.

### config.ts

### fetchWithAuth.ts

### trick-manipulator.ts

buildTrickName(c: TrickComponents): string

- Rebuilds user-input trick name to reflect proper skater terminology.

---

## Constants/

### bot-tricks.ts

Contains each pool trick specific to its bot and its difficulty.

### descriptions.ts

Descriptive text used throughout the app.

### trick-options.ts

Contains all selectable options for a trick. Each trick has a label, value, type (of trick), rotations, and modifiers.

### types.ts

Contains types that are used in multiple separate files. Types that are used once are kept within their most appropriate file.
