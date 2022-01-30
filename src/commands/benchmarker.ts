import inquirer from "inquirer";
import chalk from "chalk";
import Table from "cli-table";

import { wordleAnswersList } from "../core.js";
import { importDir } from "../utils.js";

import type { StrategyParams } from "../models/StrategyParams.js";

const strategies = await importDir("./strategies");

type SimulationResult = {
  word: string;
  wordsUsed: string[];
};

async function simulateGame(
  word: string,
  strategy: (strategyParams: StrategyParams) => Promise<string[]>
): Promise<SimulationResult> {
  const requiredLetters: string[] = [];
  const blacklistedLetters: string[] = [];
  const whitelistedLetterPositions: string[] = [];
  const blacklistedLetterPositions: string[][] = [[], [], [], [], []];

  const wordsUsed: string[] = [];

  for (let i = 0; i < 100; i++) {
    const wordSuggestions = await strategy({
      guess: i,

      requiredLetters,
      blacklistedLetters,
      whitelistedLetterPositions,
      blacklistedLetterPositions,
    });

    const guessWord = wordSuggestions[0];
    wordsUsed.push(guessWord);

    if (wordSuggestions.length > 1) {
      guessWord.split("").forEach((letter, index) => {
        if (word.includes(letter)) {
          requiredLetters.push(letter);
        } else {
          blacklistedLetters.push(letter);
        }

        if (word.charAt(index) === letter) {
          whitelistedLetterPositions[index] = letter;
        } else {
          blacklistedLetterPositions[index].push(letter);
        }
      });
    } else {
      break;
    }
  }

  return { word, wordsUsed };
}

export const name = "Strategy Benchmarker";

export async function main() {
  const selectedStrategies = (
    await inquirer.prompt([
      {
        type: "checkbox",
        name: "strategies",
        message: "Select strategies to benchmark",
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
    ])
  ).strategies;

  console.log(
    `Running ${chalk.bold.cyan(
      selectedStrategies.length * wordleAnswersList.length
    )} simulations...`
  );

  const simulationResultsTable = new Table({
    head: ["Strategy", "Starting Word", "Avg Words Used", "Most Words Used", "Failures"],
  });

  for (let strategyName of selectedStrategies) {
    const strategyMain = strategies[strategyName].main;
    strategyName = strategies[strategyName].name;

    const simulationResults = (
      await Promise.all(
        wordleAnswersList.map(async (word) => {
          return await simulateGame(word, strategyMain);
        })
      )
    ).sort((a, b) => b.wordsUsed.length - a.wordsUsed.length);
    const longestSimulation = simulationResults[0];
    const avgSimulationGuesses = (
      simulationResults.reduce((acc, sim) => acc + sim.wordsUsed.length, 0) /
      simulationResults.length
    ).toFixed(2);
    const failedSimulations = simulationResults.reduce((acc, sim) => {
      if (sim.wordsUsed.length > 6) {
        acc++;
      }

      return acc;
    }, 0);

    simulationResultsTable.push([
      strategyName,
      simulationResults[0].wordsUsed[0],
      avgSimulationGuesses,
      longestSimulation.wordsUsed.length,
      failedSimulations,
    ]);

    console.log(`Finished simulations for ${chalk.bold.cyan(strategyName)}`);
  }

  console.log(simulationResultsTable.toString());
}
