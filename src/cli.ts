import { fileURLToPath } from "url";
import { dirname } from "path";
process.chdir(dirname(fileURLToPath(import.meta.url)));

import chalk from "chalk";
// @ts-ignore
import columns from "cli-columns";
import inquierer from "inquirer";
import inquirerAutocomplete from "inquirer-autocomplete-prompt";

inquierer.registerPrompt("autocomplete", inquirerAutocomplete);

import { ColorCodes } from "./models/ColorCodes.js";

export async function askForWord(promptParams: {
  wordList: string[];
  requiredLetters: string[];
  blacklistedLetters: string[];
}): Promise<string> {
  const { wordList, requiredLetters, blacklistedLetters } = promptParams;

  console.log(`${chalk.underline.bold("Suggestions")}\n\n${columns(wordList.slice(0, 50))}\n`);

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
    console.log("\n");
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
