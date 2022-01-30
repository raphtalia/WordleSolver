import inquierer from "inquirer";
import chalk from "chalk";
import { format } from "date-fns";
import Table from "cli-table";

import { MS_IN_DAY } from "../constants.js";
import { getWordle } from "../core.js";

export const name = "Answer List";

export async function main() {
  const numAnswers = (
    await inquierer.prompt([
      {
        type: "list",
        name: "numAnswers",
        message: "How many answers would you like to see?",
        choices: [
          { name: "Today only", value: 1 },
          { name: "Next 7 days", value: 7 },
          { name: "Next 30 days", value: 30 },
          { name: "Next 365 days", value: 365 },
        ],
      },
    ])
  ).numAnswers;

  if (numAnswers === 1) {
    console.log(`Today's wordle is ${chalk.bold.green(getWordle().word)}`);
  } else {
    const answers = new Table({
      head: ["Date", "Answer"],
    });

    const nowMs = Date.now();
    for (let i = 0; i < numAnswers; i++) {
      const timeMs = nowMs + i * MS_IN_DAY;

      answers.push([format(new Date(timeMs), "MMM d, yyyy"), getWordle(timeMs).word]);
    }

    console.log(answers.toString());
  }
}
