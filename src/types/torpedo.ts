import type { BaseGameState, Player } from './core';

export type TorpedoPhase = 'placement' | 'battle';

export interface Coord {
  x: number;
  y: number;
}

export interface ShipPlacement {
  id: string;
  size: number;
  start: Coord;
  end: Coord;
  cells: Coord[];
}

export interface TorpedoCell {
  hasShip: boolean;
  shipId?: string;
  hit: boolean;
}

export interface TorpedoBoard {
  grid: TorpedoCell[][];
}

export interface TorpedoShot {
  x: number;
  y: number;
  hit: boolean;
}

export interface TorpedoGameState extends BaseGameState {
  boardSize: number;
  phase: TorpedoPhase;
  boards: Record<Player, TorpedoBoard>;
  shipsPlaced: Record<Player, ShipPlacement[]>;
  availableShips: number[];
  shotsFired: Record<Player, TorpedoShot[]>;
  prepTimeLimit: number;
  prepStartTime: number;
}

export type TorpedoMoveData =
  | { type: 'placeShip'; start: Coord; end: Coord; player: Player }
  | { type: 'fire'; target: Coord; player: Player };

export const initialTorpedoGameState: TorpedoGameState = {
  boardSize: 10,
  phase: 'placement',
  boards: {
    red: { grid: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ hasShip: false, hit: false }))) },
    blue: { grid: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ hasShip: false, hit: false }))) }
  },
  shipsPlaced: { red: [], blue: [] },
  availableShips: [2, 3, 4, 5, 6],
  shotsFired: { red: [], blue: [] },
  prepTimeLimit: 20,
  prepStartTime: 0,
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0
};
