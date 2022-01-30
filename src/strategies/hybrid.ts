import { getWordsOccuranceFreqTotal, getWordsPositionFreqTotal, search } from "../core.js";

import type { StrategyParams } from "../models/StrategyParams";

export const name = "Letter/Positional Frequency Hybrid";

export async function main(strategyParams: StrategyParams): Promise<string[]> {
  const {
    guess,
    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  } = strategyParams;

  return search({
    allowDuplicates: guess !== 0,

    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  }).sort((a, b) => {
    return (
      getWordsOccuranceFreqTotal(b) +
      getWordsPositionFreqTotal(b) -
      (getWordsOccuranceFreqTotal(a) + getWordsPositionFreqTotal(a))
    );
  });
}
