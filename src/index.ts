import { fileURLToPath } from "url";
import { dirname } from "path";
process.chdir(dirname(fileURLToPath(import.meta.url)));

import inquierer from "inquirer";

import { importDir } from "./utils.js";

const modules = await importDir("./commands");

const chosenCommand = (
  await inquierer.prompt([
    {
      type: "list",
      name: "command",
      message: "Which command would you like to run?",
      choices: Object.keys(modules).map((commandName) => {
        return {
          name: modules[commandName].name,
          value: commandName,
        };
      }),
    },
  ])
).command;

console.log();

modules[chosenCommand].main();
