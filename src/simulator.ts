import { getOccurancesInString } from "./utils.js";

import { ColorCodes } from "./models/ColorCodes.js";
import type { StrategyParams } from "./models/StrategyParams";
import type { SimulationResult } from "./models/SimulationResult";

export async function simulateGame(simulationParams: {
  word: string;
  strategy: (strategyParams: StrategyParams) => Promise<string[]>;
}): Promise<SimulationResult> {
  const { word, strategy } = simulationParams;

  const requiredLetters: string[] = [];
  const blacklistedLetters: string[] = [];
  const whitelistedLetterPositions: string[] = [];
  const blacklistedLetterPositions: string[][] = [[], [], [], [], []];

  const wordsUsed: string[] = [];

  for (let i = 0; i < 100; i++) {
    const wordSuggestions = await strategy({
      guess: i,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    });

    const guessWord = wordSuggestions[0];
    wordsUsed.push(guessWord);

    if (guessWord === word) {
      break;
    }

    guessWord.split("").forEach((letter, index) => {
      if (word.includes(letter)) {
        requiredLetters.push(letter);
      } else {
        blacklistedLetters.push(letter);
      }

      if (word.charAt(index) === letter) {
        whitelistedLetterPositions[index] = letter;
      } else {
        blacklistedLetterPositions[index].push(letter);
      }
    });
  }

  return { word, wordsUsed };
}

export function simulationResultToColorCodes(simResult: SimulationResult): string[] {
  const { word, wordsUsed } = simResult;
  const colorCodes: string[] = [];

  wordsUsed.forEach((guessWord) =>
    colorCodes.push(
      guessWord
        .split("")
        .map((letter, i) => {
          if (word.charAt(i) === letter) {
            return ColorCodes.Green;
          } else if (
            word
              .split("")
              .map((letter, i) => (letter === guessWord.charAt(i) ? "" : letter))
              .join("")
              .includes(letter)
          ) {
            return ColorCodes.Yellow;
          } else {
            return ColorCodes.Black;
          }
        })
        .join("")
    )
  );

  return colorCodes;
}
