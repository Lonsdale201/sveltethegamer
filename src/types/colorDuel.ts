import type { BaseGameState, Player } from './core';

export type Cell = 'empty' | 'red' | 'blue';

export interface ColorDuelGameState extends BaseGameState {
  board: Cell[][];
  stealsUsed: Record<Player, number>;
  maxSteals: number;
  boardSize: number;
}

export interface MoveData {
  x: number;
  y: number;
  player: Player;
}

export const initialColorDuelGameState: ColorDuelGameState = {
  board: Array(3).fill(null).map(() => Array(3).fill('empty')),
  currentTurn: 'red',
  stealsUsed: { red: 0, blue: 0 },
  maxSteals: 1,
  boardSize: 3,
  winner: null,
  gameStarted: false,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};