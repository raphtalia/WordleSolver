import { getWordsPositionFreqTotal, search } from "../core.js";

import { Game } from "../classes/Game.js";

export const name = "Positional Frequency";

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

  return search({
    allowDuplicates: guess !== 0,

    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  }).sort(sort);
}
