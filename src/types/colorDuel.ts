import type { BaseGameState, Player } from './core';

export type Cell = 'empty' | 'red' | 'blue';

export interface ColorDuelGameState extends BaseGameState {
  board: Cell[][];
  stolen: Record<Player, boolean>;
}

export interface MoveData {
  x: number;
  y: number;
  player: Player;
}

export const initialColorDuelGameState: ColorDuelGameState = {
  board: Array(3).fill(null).map(() => Array(3).fill('empty')),
  currentTurn: 'red',
  stolen: { red: false, blue: false },
  winner: null,
  gameStarted: false,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};