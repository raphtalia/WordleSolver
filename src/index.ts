import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { dirname } from "path";

import chalk from "chalk";
// @ts-ignore
import columns from "cli-columns";
import inquierer from "inquirer";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const masterWordList: string[] = JSON.parse(readFileSync("./words.json", "utf8"));
const letterOccurances: { [letter: string]: number } = {};
const letterFreqs: { [letter: string]: number } = {};

masterWordList.forEach((word) => {
  word.split("").forEach((letter) => {
    if (!letterOccurances[letter]) {
      letterOccurances[letter] = 0;
    }

    letterOccurances[letter.toLowerCase()]++;
  });
});

Object.keys(letterOccurances).forEach((letter) => {
  letterFreqs[letter] = letterOccurances[letter] / masterWordList.length;
});

function hasDuplicateLetters(word: string): boolean {
  return word
    .split("")
    .some((letter, i) => word.slice(0, i).includes(letter) || word.slice(i + 1).includes(letter));
}

function getWordsLetterFreqTotal(word: string): number {
  return word.split("").reduce((total, letter) => {
    return total + letterFreqs[letter.toLowerCase()];
  }, 0);
}

function sortWordsByFreq(words: string[]): string[] {
  return words.sort((a, b) => {
    return getWordsLetterFreqTotal(b) - getWordsLetterFreqTotal(a);
  });
}

const includedLetters: string[] = [];
const excludedLetters: string[] = [];
const goodLetterPositions: string[] = [];
const badLetterPositions: string[][] = [[], [], [], [], []];

function getBestWords(allowDuplicates = false) {
  return sortWordsByFreq(
    allowDuplicates ? masterWordList : masterWordList.filter((word) => !hasDuplicateLetters(word))
  ).filter((word) => {
    if (
      goodLetterPositions.some((letter, i) => {
        if (word.charAt(i) !== letter) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      badLetterPositions.some((letterArray, i) => {
        if (letterArray.includes(word.charAt(i))) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      includedLetters.some((letter) => {
        if (!word.includes(letter)) {
          return true;
        }
      })
    ) {
      return false;
    }

    if (
      excludedLetters.some((letter) => {
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

/*
function getOrdinal(i: number): string {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return `${i}st`;
  }
  if (j == 2 && k != 12) {
    return `${i}nd`;
  }
  if (j == 3 && k != 13) {
    return `${i}rd`;
  }
  return `${i}th`;
}
*/

for (let i = 0; i < 6; i++) {
  const wordSuggestions = i === 0 ? getBestWords(false) : getBestWords(true);

  if (wordSuggestions.length > 1) {
    console.log(
      `${chalk.underline.bold("Suggestions")}\n\n${columns(wordSuggestions.slice(0, 50))}\n`
    );

    if (includedLetters.length > 0) {
      console.log(
        chalk.green(`Including ${chalk.bold(includedLetters.sort().join(", ").toUpperCase())}`)
      );
    }

    if (excludedLetters.length > 0) {
      console.log(
        chalk.red(`Excluding ${chalk.bold(excludedLetters.sort().join(", ").toUpperCase())}`)
      );
    }

    if (includedLetters.length > 0 || excludedLetters.length > 0) {
      console.log("\n");
    }

    const response = await inquierer.prompt([
      {
        type: "input",
        name: "word",
        message: "Enter the word you chose",
        validate: (input) => {
          input = input.toLowerCase();

          if (input.length !== 5) {
            return "Please enter 5 letter word";
          }

          if (!wordSuggestions.includes(input)) {
            return "Word is not in list of suggestions";
          }

          return true;
        },
      },
      {
        type: "input",
        name: "colors",
        message: `Enter the colors of the tiles ${chalk.green("(g)reen")} ${chalk.yellow(
          "(y)ellow"
        )} ${chalk.black("(b)lack")}`,
        validate: (input: string, answers) => {
          input = input.toLowerCase();

          if (input.length !== 5) {
            return "Please enter 5 characters";
          }

          let errorMessage: string | undefined;

          input.split("").some((code, codeIndex) => {
            if (code !== "g" && code !== "y" && code !== "b") {
              errorMessage = `${code} is not a valid color code`;
              return true;
            }

            const letter: string = answers.word.charAt(codeIndex);
            switch (code) {
              case "g":
                if (excludedLetters.includes(letter)) {
                  errorMessage = `Cannot include ${chalk.red(
                    letter.toUpperCase()
                  )}, it is already excluded`;
                }
                break;
              case "y":
                if (excludedLetters.includes(letter)) {
                  errorMessage = `Cannot include ${chalk.red(
                    letter.toUpperCase()
                  )}, it is already excluded`;
                }
                break;
              /*
              case "b":
                if (includedLetters.includes(letter)) {
                  errorMessage = `Cannot exclude ${chalk.red(letter)}, it is already included`;
                }
                break;
                */
            }

            return !!errorMessage;
          });

          return errorMessage ?? true;
        },
        transformer: (input: string) => {
          return input
            .toLocaleLowerCase()
            .split("")
            .map((code) => {
              switch (code) {
                case "g":
                  return chalk.bgGreen("   ");
                case "y":
                  return chalk.bgYellow("   ");
                case "b":
                  return chalk.bgBlack("   ");
              }
            })
            .join(" ");
        },
      },
    ]);
    const word: string = response.word.toLowerCase();
    const colors: string = response.colors.toLowerCase();

    if (colors === "ggggg") {
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
          case "g":
            if (!includedLetters.includes(letter)) {
              includedLetters.push(letter);
            }

            if (goodLetterPositions[i] !== letter) {
              goodLetterPositions[i] = letter;
            }

            break;
          case "y":
            if (!includedLetters.includes(letter)) {
              includedLetters.push(letter);
            }

            if (!badLetterPositions[i].includes(letter)) {
              badLetterPositions[i].push(letter);
            }

            break;
          case "b":
            if (!includedLetters.includes(letter) && !excludedLetters.includes(letter)) {
              excludedLetters.push(letter);
            }

            if (!badLetterPositions[i].includes(letter)) {
              badLetterPositions[i].push(letter);
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
