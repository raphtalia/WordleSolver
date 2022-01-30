import { fileURLToPath } from "url";
import { dirname } from "path";
process.chdir(dirname(fileURLToPath(import.meta.url)));

import { readFileSync } from "fs";

const masterWordList: string[] = JSON.parse(readFileSync("./words.json", "utf8"));

// Calculates percentage of how often letters occur in words
const letterOccurances: { [letter: string]: number } = {};
const letterFreqs: { [letter: string]: number } = {};

// Calculates percentage of how often letters occur in words while taking into account position
const positionOccurances: { [letter: string]: number }[] = [{}, {}, {}, {}, {}];
const positionFreqs: { [letter: string]: number }[] = [{}, {}, {}, {}, {}];

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

positionFreqs.forEach((freqs) => {
  Object.keys(freqs).forEach((letter) => {
    freqs[letter] = freqs[letter] / Object.keys(freqs).length;
  });
});

function hasDuplicateLetters(word: string): boolean {
  return word
    .split("")
    .some((letter, i) => word.slice(0, i).includes(letter) || word.slice(i + 1).includes(letter));
}

function getWordsOccuranceFreqTotal(word: string): number {
  return word.split("").reduce((total, letter) => {
    return total + letterFreqs[letter.toLowerCase()];
  }, 0);
}

function getWordsPositionFreqTotal(word: string): number {
  return word.split("").reduce((total, letter, i) => {
    return total + positionFreqs[i][letter.toLowerCase()];
  }, 0);
}

export function sortWordsByOccuranceFreq(words: string[]): string[] {
  return words.sort((a, b) => {
    return getWordsOccuranceFreqTotal(b) - getWordsOccuranceFreqTotal(a);
  });
}

export function sortWordsByPositionFreq(words: string[]): string[] {
  return words.sort((a, b) => {
    return getWordsPositionFreqTotal(b) - getWordsPositionFreqTotal(a);
  });
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
