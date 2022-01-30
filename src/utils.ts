import { basename } from "path";

import fg from "fast-glob";

import type Module from "module";

/*
export function getOrdinal(i: number): string {
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

export function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
*/

export async function importDir(path: string): Promise<{ [name: string]: { [key: string]: any } }> {
  const modules: { [name: string]: Module } = {};

  await Promise.all(
    fg.sync([`${path}/*.js`, `${path}/**/index.js`]).map(async (path) => {
      modules[basename(path, ".js")] = await import(path);
    })
  );

  return modules;
}

export function lerpRGB(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
  alpha: number
): [number, number, number] {
  return [
    Math.round(rgb1[0] * (1 - alpha) + rgb2[0] * alpha),
    Math.round(rgb1[1] * (1 - alpha) + rgb2[1] * alpha),
    Math.round(rgb1[2] * (1 - alpha) + rgb2[2] * alpha),
  ];
}
