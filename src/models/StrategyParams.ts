export type StrategyParams = {
  guess: number;

  wordList?: string[];
  requiredLetters: string[];
  blacklistedLetters: string[];
  whitelistedLetterPositions: string[];
  blacklistedLetterPositions: string[][];
};
