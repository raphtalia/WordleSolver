import { ColorCodes } from "../models/ColorCodes.js";

export class Game {
  public readonly requiredLetters: string[] = [];
  public readonly blacklistedLetters: string[] = [];
  public readonly whitelistedLetterPositions: string[] = [];
  public readonly blacklistedLetterPositions: string[][] = [[], [], [], [], []];
  public readonly wordsUsed: string[] = [];
  public guess: number = 0;
  public strategy?: (game: Game) => Promise<string[]>;
  public word?: string;
  public finished: boolean = false;

  constructor(strategy?: (game: Game) => Promise<string[]>, word?: string) {
    this.strategy = strategy;
    this.word = word;
  }

  private blacklistLetter(letter: string, pos?: number) {
    if (pos) {
      if (!this.blacklistedLetterPositions[pos].includes(letter)) {
        this.blacklistedLetterPositions[pos].push(letter);
      }
    } else if (!this.requiredLetters.includes(letter)) {
      if (!this.blacklistedLetters.includes(letter)) {
        this.blacklistedLetters.push(letter);
      }
    }
  }

  private whitelistLetter(letter: string, pos?: number) {
    if (pos) {
      if (this.whitelistedLetterPositions[pos] !== letter) {
        this.whitelistedLetterPositions[pos] = letter;
      }
    } else if (!this.blacklistedLetters.includes(letter)) {
      if (!this.requiredLetters.includes(letter)) {
        this.requiredLetters.push(letter);
      }
    }
  }

  public tryWord(guessWord: string, colorCodes?: string): boolean {
    if (this.finished) {
      throw new Error("Game is already finished");
    }

    this.wordsUsed.push(guessWord);
    this.guess++;

    if (colorCodes) {
      if (colorCodes.length !== 5) {
        throw new Error("Color code must be 5 characters long");
      }

      if (colorCodes === ColorCodes.Green.repeat(5)) {
        this.finished = true;
        return true;
      }

      colorCodes.split("").forEach((code, i) => {
        const letter = guessWord.charAt(i);

        switch (code) {
          case ColorCodes.Green:
            this.whitelistLetter(letter, i);

            break;
          case ColorCodes.Yellow:
            this.whitelistLetter(letter);
            this.blacklistLetter(letter, i);

            break;
          case ColorCodes.Black:
            this.blacklistLetter(letter);

            break;
        }
      });
    } else if (this.word) {
      const word = this.word;

      guessWord.split("").forEach((letter, i) => {
        if (word.includes(letter)) {
          this.requiredLetters.push(letter);
        } else {
          this.blacklistedLetters.push(letter);
        }

        if (word.charAt(i) === letter) {
          this.whitelistedLetterPositions[i] = letter;
        } else {
          this.blacklistedLetterPositions[i].push(letter);
        }
      });

      if (guessWord === word) {
        this.finished = true;
      }
    }

    return this.finished;
  }

  public async getSuggestions(strategy?: (game: Game) => Promise<string[]>): Promise<string[]> {
    if (!strategy && !this.strategy) {
      throw new Error("No strategy provided");
    }

    if (this.finished) {
      return [];
    }

    strategy = strategy ?? this.strategy;

    // @ts-ignore
    return await strategy(this);
  }

  public async tryBestWord(strategy?: (game: Game) => Promise<string[]>): Promise<boolean> {
    if (this.finished) {
      return true;
    }

    return this.tryWord((await this.getSuggestions(strategy))[0]);
  }
}
