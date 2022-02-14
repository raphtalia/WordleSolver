import inquierer from "inquirer";
import chalk from "chalk";
// @ts-ignore
import columns from "cli-columns";

import { importDir } from "../utils.js";
import { Game } from "../classes/Game.js";

import { ColorCodes } from "../models/ColorCodes.js";

const strategies = await importDir("./strategies");

const MAX_SUGGESTIONS_DISPLAY = 50;

export async function askForWord(promptParams: {
  wordList: string[];
  requiredLetters: string[];
  blacklistedLetters: string[];
}): Promise<string> {
  const { wordList, requiredLetters, blacklistedLetters } = promptParams;
  const wordListLength = wordList.length;

  console.log(
    `${chalk.bold("Suggestions")} (${
      wordListLength > MAX_SUGGESTIONS_DISPLAY
        ? `${MAX_SUGGESTIONS_DISPLAY}/${wordListLength}`
        : wordListLength
    })\n${columns(wordList.slice(0, MAX_SUGGESTIONS_DISPLAY), { sort: false })}\n`
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
  const { numGames, strategyName } = await inquierer.prompt([
    {
      type: "number",
      name: "numGames",
      message: "How many simultaneous games do you want to play?",
    },
    {
      type: "list",
      name: "strategyName",
      message: "Which strategy would you like to use?",
      choices: Object.keys(strategies).map((strategyName) => {
        return {
          name: strategies[strategyName].name,
          value: strategyName,
        };
      }),
    },
  ]);

  const strategy: (game: Game) => Promise<string[]> = strategies[strategyName].main;
  const sort: (a: string, b: string) => number = strategies[strategyName].sort;

  const games: Game[] = [];

  for (let i = 0; i < numGames; i++) {
    games.push(new Game(strategy));
  }

  for (let i = 0; i < 9; i++) {
    let wordSuggestions: string[] = [];
    for (const game of games) {
      if (!game.finished) {
        wordSuggestions = wordSuggestions.concat(await game.getSuggestions());
      }
    }
    wordSuggestions = wordSuggestions
      .filter((word, i) => wordSuggestions.indexOf(word) === i)
      .sort(sort);

    const word = await askForWord({
      wordList: wordSuggestions,
      requiredLetters: numGames === 1 ? games[0].requiredLetters : [],
      blacklistedLetters: numGames === 1 ? games[0].blacklistedLetters : [],
    });

    for (const game of games) {
      if (!game.finished) {
        const colors = await askForColorCodes({
          word,
          blacklistedLetters: game.blacklistedLetters,
        });

        if (game.tryWord(word, colors)) {
          console.log(
            `${chalk.bold("Got the word")} ${chalk.bold.green(word)} in ${i + 1} ${
              i === 0 ? "guess" : "guesses"
            }`
          );
        }
      }
    }

    /*
    if (wordSuggestions.length > 1) {
      const word = await askForWord({
        wordList: wordSuggestions,
        requiredLetters: game.requiredLetters,
        blacklistedLetters: game.blacklistedLetters,
      });
      const colors = await askForColorCodes({ word, blacklistedLetters: game.blacklistedLetters });

      if (game.tryWord(word, colors)) {
        console.log(
          `${chalk.bold("Got the word")} ${chalk.bold.green(word)} in ${i + 1} ${
            i === 0 ? "guess" : "guesses"
          }`
        );
      }
    } else {
      console.log(
        `${chalk.bold("Got the word")} ${chalk.bold.green(wordSuggestions[0])} in ${i + 1} ${
          i === 0 ? "guess" : "guesses"
        }`
      );
      break;
    }
    */
  }
}
