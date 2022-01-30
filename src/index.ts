import { fileURLToPath } from "url";
import { dirname } from "path";
process.chdir(dirname(fileURLToPath(import.meta.url)));

import chalk from "chalk";

import { search, sortWordsByOccuranceFreq } from "./core.js";
import { askForWord, askForColorCodes } from "./cli.js";
import { ColorCodes } from "./models/ColorCodes.js";

const requiredLetters: string[] = [];
const blacklistedLetters: string[] = [];
const whitelistedLetterPositions: string[] = [];
const blacklistedLetterPositions: string[][] = [[], [], [], [], []];

for (let i = 0; i < 6; i++) {
  const wordSuggestions = sortWordsByOccuranceFreq(
    search({
      allowDuplicates: i !== 0,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    })
  );

  if (wordSuggestions.length > 1) {
    const word = await askForWord({
      wordList: wordSuggestions,
      requiredLetters,
      blacklistedLetters,
    });
    const colors = await askForColorCodes({ word, blacklistedLetters });

    if (colors === ColorCodes.Green.repeat(5)) {
      console.log(
        `${chalk.bold("Got the word")} ${chalk.bold.green(word)} in ${i + 1} ${
          i === 0 ? "guess" : "guesses"
        }`
      );
      break;
    } else {
      colors.split("").forEach((code, i) => {
        const letter = word.charAt(i);

        switch (code) {
          case ColorCodes.Green:
            if (!requiredLetters.includes(letter)) {
              requiredLetters.push(letter);
            }

            if (whitelistedLetterPositions[i] !== letter) {
              whitelistedLetterPositions[i] = letter;
            }

            break;
          case ColorCodes.Yellow:
            if (!requiredLetters.includes(letter)) {
              requiredLetters.push(letter);
            }

            if (!blacklistedLetterPositions[i].includes(letter)) {
              blacklistedLetterPositions[i].push(letter);
            }

            break;
          case ColorCodes.Black:
            if (!requiredLetters.includes(letter) && !blacklistedLetters.includes(letter)) {
              blacklistedLetters.push(letter);
            }

            if (!blacklistedLetterPositions[i].includes(letter)) {
              blacklistedLetterPositions[i].push(letter);
            }

            break;
        }
      });

      console.log("\n");
    }
  } else {
    console.log(
      `${chalk.bold("Got the word")} ${chalk.bold.green(wordSuggestions[0])} in ${i + 1} ${
        i === 0 ? "guess" : "guesses"
      }`
    );
    break;
  }
}
