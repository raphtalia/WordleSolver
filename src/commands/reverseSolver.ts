import inquirer from "inquirer";
import chalk from "chalk";

import { wordleAnswersList } from "../core.js";
import { importDir } from "../utils.js";
import { simulateGame, simulationResultToColorCodes } from "../simulator.js";

import { ColorCodes } from "../models/ColorCodes.js";

const strategies = await importDir("./strategies");

export const name = "Reverse Solver";

export async function main() {
  const answers = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "word",
      message: "Enter the word you chose",
      suggestOnly: true,
      // @ts-ignore
      source: async (_, input: string) => {
        return input
          ? wordleAnswersList.filter((word) => word.startsWith(input))
          : wordleAnswersList;
      },
      validate: (input) => {
        input = input.toLowerCase();

        if (input.length !== 5) {
          return "Please enter 5 letter word";
        }

        if (!wordleAnswersList.includes(input)) {
          return "Word is not in list of answers";
        }

        return true;
      },
    },
    {
      type: "checkbox",
      name: "strategies",
      message: "Select strategies to use",
      choices: Object.keys(strategies).map((strategyName) => ({
        name: strategies[strategyName].name,
        value: strategyName,
      })),
      validate: (answer) => {
        if (answer.length < 1) {
          return "You must choose at least 1 strategy";
        }

        return true;
      },
    },
  ]);
  const word: string = answers.word;
  const selectedStrategies: string[] = answers.strategies;

  for (let strategyName of selectedStrategies) {
    const strategyMain = strategies[strategyName].main;
    strategyName = strategies[strategyName].name;

    console.log(chalk.bold.underline(strategyName));

    const simResults = await simulateGame({
      word,
      strategy: strategyMain,
    });

    simulationResultToColorCodes(simResults).forEach((colorCodes, guessNum) =>
      console.log(
        colorCodes
          .split("")
          .map((colorCode, i) => {
            const guessChar = chalk.white(simResults.wordsUsed[guessNum].charAt(i).toUpperCase());

            switch (colorCode) {
              case ColorCodes.Green:
                return chalk.bgGreen(` ${guessChar} `);
              case ColorCodes.Yellow:
                return chalk.bgYellow(` ${guessChar} `);
              case ColorCodes.Black:
                return chalk.bgBlack(` ${guessChar} `);
            }
          })
          .join(" ")
      )
    );

    console.log();
  }
}
