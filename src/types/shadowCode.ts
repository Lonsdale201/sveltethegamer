import type { BaseGameState, Player } from './core';

export interface ShadowCodeGameState extends BaseGameState {
  playerCodes: Record<Player, number[]>;
  guesses: Record<Player, GuessResult[]>;
  currentGuess: Record<Player, number[]>;
  codeSet: Record<Player, boolean>;
}

export interface GuessResult {
  guess: number[];
  exactMatches: number; // Correct number in correct position
  partialMatches: number; // Correct number in wrong position
  timestamp: number;
}

export interface ShadowCodeMoveData {
  type: 'setCode' | 'makeGuess';
  code?: number[];
  guess?: number[];
  player: Player;
}

export const initialShadowCodeGameState: ShadowCodeGameState = {
  playerCodes: { red: [], blue: [] },
  guesses: { red: [], blue: [] },
  currentGuess: { red: [0, 0, 0], blue: [0, 0, 0] },
  codeSet: { red: false, blue: false },
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};