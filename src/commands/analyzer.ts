import { ALPHABET } from "../constants.js";
import { wordleAnswersList, letterFreqs, positionFreqs } from "../core.js";
import { lerpRGB } from "../utils.js";

import chalk from "chalk";
import Table from "cli-table";

export const name = "Word Analyzer";

export async function main() {
  const letterFreqsTable = new Table({
    head: ["Letter", "Frequency"],
  });

  const letterFreqsValues = Object.values(letterFreqs);
  const letterFreqsHighest = Math.max(...letterFreqsValues);
  const letterFreqsLowest = Math.min(...letterFreqsValues);

  Object.keys(letterFreqs)
    .sort()
    .forEach((letter) => {
      let freq = letterFreqs[letter];

      letterFreqsTable.push([
        letter.toUpperCase(),
        chalk.rgb(
          ...lerpRGB([255, 0, 0], [0, 255, 0], (freq - letterFreqsLowest) / letterFreqsHighest)
        )(`${(freq * 100).toFixed(2)}%`),
      ]);
    });

  console.log(letterFreqsTable.toString());

  const positionFreqsTable = new Table({
    head: ["", "1", "2", "3", "4", "5"],
  });

  const rows: { [letter: string]: string[] }[] = [];
  ALPHABET.toUpperCase()
    .split("")
    .forEach((letter) => {
      rows.push({ [letter]: [] });
    });

  positionFreqs.forEach((posFreqs) => {
    const posFreqsValues = Object.values(posFreqs);
    const posFreqsHighest = Math.max(...posFreqsValues);
    const posFreqsLowest = Math.min(...posFreqsValues);

    Object.keys(posFreqs)
      .sort()
      .forEach((letter) => {
        let freq = posFreqs[letter];

        rows[ALPHABET.indexOf(letter.toLowerCase())][letter.toUpperCase()].push(
          chalk.rgb(
            ...lerpRGB([255, 0, 0], [0, 255, 0], (freq - posFreqsLowest) / posFreqsHighest)
          )(`${(freq * 100).toFixed(2)}%`)
        );
      });
  });

  positionFreqsTable.push(...rows);

  console.log(positionFreqsTable.toString());
}
