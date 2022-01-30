import { sortWordsByOccuranceFreq, search } from "../core.js";

import type { StrategyParams } from "../models/StrategyParams";

export const name = "Letter Frequency";

export async function main(strategyParams: StrategyParams): Promise<string[]> {
  const {
    guess,
    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  } = strategyParams;

  return sortWordsByOccuranceFreq(
    search({
      allowDuplicates: guess !== 0,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    })
  );
}
