import { sortWordsByPositionFreq, search } from "../core.js";

import type { StrategyParams } from "../models/StrategyParams";

export const name = "Positional Frequency";

export async function main(strategyParams: StrategyParams): Promise<string[]> {
  const {
    guess,
    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  } = strategyParams;

  return sortWordsByPositionFreq(
    search({
      allowDuplicates: guess !== 0,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    })
  );
}
