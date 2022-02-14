import { getWordsPositionFreqTotal, search } from "../core.js";

import { Game } from "../classes/Game.js";

export const name = "Quordle Positional Frequency";

export function sort(a: string, b: string): number {
  return getWordsPositionFreqTotal(b) - getWordsPositionFreqTotal(a);
}

export async function main(game: Game): Promise<string[]> {
  const {
    guess,
    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  } = game;

  let suggestions = search({
    allowDuplicates: guess > 2,

    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  });

  if (suggestions.length === 0) {
    suggestions = search({
      allowDuplicates: guess !== 0,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    });
  }

  return suggestions.sort(sort);
}
