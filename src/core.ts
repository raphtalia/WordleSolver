import { readFileSync } from "fs";

import { MS_IN_DAY, GAME_EPOCH_MS } from "./constants.js";

const masterWordList: string[] = JSON.parse(readFileSync("./WordleAnswers.json", "utf8"));
export { masterWordList as wordleAnswersList };

// Calculates percentage of how often letters occur in words
const letterOccurances: { [letter: string]: number } = {};
export const letterFreqs: { [letter: string]: number } = {};

// Calculates percentage of how often letters occur in words while taking into account position
const positionOccurances: { [letter: string]: number }[] = [{}, {}, {}, {}, {}];
export const positionFreqs: { [letter: string]: number }[] = [{}, {}, {}, {}, {}];

masterWordList.forEach((word) => {
  word.split("").forEach((letter, i) => {
    letter = letter.toLowerCase();

    if (!letterOccurances[letter]) {
      letterOccurances[letter] = 0;
    }
    letterOccurances[letter]++;

    if (!positionOccurances[i][letter]) {
      positionOccurances[i][letter] = 0;
    }
    positionOccurances[i][letter]++;
  });
});

Object.keys(letterOccurances).forEach((letter) => {
  letterFreqs[letter] = letterOccurances[letter] / masterWordList.length;
});

positionOccurances.forEach((freqs, i) => {
  Object.keys(freqs).forEach((letter) => {
    positionFreqs[i][letter] = freqs[letter] / Object.values(freqs).reduce((a, b) => a + b, 0);
  });
});

function hasDuplicateLetters(word: string): boolean {
  return word
    .split("")
    .some((letter, i) => word.slice(0, i).includes(letter) || word.slice(i + 1).includes(letter));
}

export function getWordsOccuranceFreqTotal(word: string): number {
  return word.split("").reduce((total, letter) => {
    return total + letterFreqs[letter.toLowerCase()];
  }, 0);
}

export function getWordsPositionFreqTotal(word: string): number {
  return word.split("").reduce((total, letter, i) => {
    return total + positionFreqs[i][letter.toLowerCase()];
  }, 0);
}

export function search(searchParams: {
  wordList?: string[];

  allowDuplicates?: boolean;

  requiredLetters: string[];
  blacklistedLetters: string[];
  whitelistedLetterPositions: string[];
  blacklistedLetterPositions: string[][];
}): string[] {
  const wordList =
    searchParams.allowDuplicates ?? true
      ? searchParams.wordList ?? masterWordList
      : (searchParams.wordList ?? masterWordList).filter((word) => !hasDuplicateLetters(word));
  const {
    requiredLetters,
    blacklistedLetters,
    whitelistedLetterPositions,
    blacklistedLetterPositions,
  } = searchParams;

  return wordList.filter((word) => {
    if (
      whitelistedLetterPositions.some((letter, i) => {
        if (word.charAt(i) !== letter) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      blacklistedLetterPositions.some((letterArray, i) => {
        if (letterArray.includes(word.charAt(i))) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      requiredLetters.some((letter) => {
        if (!word.includes(letter)) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      blacklistedLetters.some((letter) => {
        if (word.includes(letter)) {
          return true;
        }
      })
    ) {
      return false;
    }

    return true;
  });
}

export function getWordle(timeInMs?: number): { word: string; index: number } {
  const index = Math.floor(((timeInMs ?? Date.now()) - GAME_EPOCH_MS) / MS_IN_DAY);

  return {
    word: masterWordList[index % masterWordList.length],
    index,
  };
}
