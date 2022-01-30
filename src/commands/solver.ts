import inquierer from "inquirer";
import chalk from "chalk";
// @ts-ignore
import columns from "cli-columns";

import { importDir } from "../utils.js";

import { ColorCodes } from "../models/ColorCodes.js";
import type { StrategyParams } from "../models/StrategyParams.js";

const strategies = await importDir("./strategies");
const maxWordSuggestionsToDisplay = 50;
export async function askForWord(promptParams: {
  wordList: string[];
  requiredLetters: string[];
  blacklistedLetters: string[];
}): Promise<string> {
  const { wordList, requiredLetters, blacklistedLetters } = promptParams;
  const wordListLength = wordList.length;

  console.log(
    `${chalk.bold("Suggestions")} (${
      wordListLength > maxWordSuggestionsToDisplay
        ? `${maxWordSuggestionsToDisplay}/${wordListLength}`
        : wordListLength
    })\n${columns(wordList.slice(0, maxWordSuggestionsToDisplay), { sort: false })}\n`
  );

  if (requiredLetters.length > 0) {
    console.log(
      chalk.green(`Including ${chalk.bold(requiredLetters.sort().join(", ").toUpperCase())}`)
    );
  }

  if (blacklistedLetters.length > 0) {
    console.log(
      chalk.red(`Excluding ${chalk.bold(blacklistedLetters.sort().join(", ").toUpperCase())}`)
    );
  }

  if (requiredLetters.length > 0 || blacklistedLetters.length > 0) {
    console.log();
  }

  return (
    await inquierer.prompt([
      {
        type: "autocomplete",
        name: "word",
        message: "Enter the word you chose",
        suggestOnly: true,
        // @ts-ignore
        source: async (_, input: string) => {
          return input ? wordList.filter((word) => word.startsWith(input)) : wordList;
        },
        validate: (input) => {
          input = input.toLowerCase();

          if (input.length !== 5) {
            return "Please enter 5 letter word";
          }

          if (!wordList.includes(input)) {
            return "Word is not in list of suggestions";
          }

          return true;
        },
      },
    ])
  ).word.toLowerCase();
}

export async function askForColorCodes(promptParams: {
  word: string;
  blacklistedLetters: string[];
}): Promise<string> {
  const { word, blacklistedLetters } = promptParams;

  return (
    await inquierer.prompt([
      {
        type: "input",
        name: "colors",
        message: `Enter the colors of the tiles ${chalk.green(
          `[${ColorCodes.Green.toUpperCase()}] Green`
        )} ${chalk.yellow(`[${ColorCodes.Yellow.toUpperCase()}] Yellow`)} ${chalk.black(
          `[${ColorCodes.Black.toUpperCase()}] Black`
        )}\n`,
        validate: (input: string) => {
          input = input.toLowerCase();

          if (input.length !== 5) {
            return "Please enter 5 characters";
          }

          let errorMessage: string | undefined;

          input.split("").some((code, i) => {
            if (
              code !== ColorCodes.Green &&
              code !== ColorCodes.Yellow &&
              code !== ColorCodes.Black
            ) {
              errorMessage = `${code.toUpperCase()} is not a valid color code`;
              return true;
            }

            const letter: string = word.charAt(i);
            switch (code) {
              case ColorCodes.Green:
                if (blacklistedLetters.includes(letter)) {
                  errorMessage = `Cannot include ${chalk.red(
                    letter.toUpperCase()
                  )}, it is already excluded`;
                }
                break;
              case ColorCodes.Yellow:
                if (blacklistedLetters.includes(letter)) {
                  errorMessage = `Cannot include ${chalk.red(
                    letter.toUpperCase()
                  )}, it is already excluded`;
                }
                break;
              /*
            case ColorCodes.Black:
              if (requiredLetters.includes(letter)) {
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
            .map((code, i) => {
              switch (code) {
                case ColorCodes.Green:
                  return chalk.bgGreen(` ${chalk.white(word.charAt(i).toUpperCase())} `);
                case ColorCodes.Yellow:
                  return chalk.bgYellow(` ${chalk.white(word.charAt(i).toUpperCase())} `);
                case ColorCodes.Black:
                  return chalk.bgBlack(` ${chalk.white(word.charAt(i).toUpperCase())} `);
                default:
                  return chalk.bgRed(` ${chalk.white(word.charAt(i).toUpperCase())} `);
              }
            })
            .join(" ");
        },
      },
    ])
  ).colors.toLowerCase();
}

export const name = "Solver";

export async function main() {
  const requiredLetters: string[] = [];
  const blacklistedLetters: string[] = [];
  const whitelistedLetterPositions: string[] = [];
  const blacklistedLetterPositions: string[][] = [[], [], [], [], []];

  const strategy: (strategyParams: StrategyParams) => Promise<string[]> =
    strategies[
      (
        await inquierer.prompt([
          {
            type: "list",
            name: "strategy",
            message: "Which strategy would you like to use?",
            choices: Object.keys(strategies).map((strategyName) => {
              return {
                name: strategies[strategyName].name,
                value: strategyName,
              };
            }),
          },
        ])
      ).strategy
    ].main;

  for (let i = 0; i < 6; i++) {
    const wordSuggestions = await strategy({
      guess: i,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    });

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
}
