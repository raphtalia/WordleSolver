import { Game } from "./classes/Game.js";

import { ColorCodes } from "./models/ColorCodes.js";
import type { SimulationResult } from "./models/SimulationResult";

export async function simulateGame(simulationParams: {
  word: string;
  strategy: (game: Game) => Promise<string[]>;
}): Promise<SimulationResult> {
  const { word, strategy } = simulationParams;

  const game = new Game(strategy, word);

  for (let i = 0; i < 100; i++) {
    if (await game.tryBestWord()) {
      break;
    }
  }

  return { word, wordsUsed: game.wordsUsed };
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
