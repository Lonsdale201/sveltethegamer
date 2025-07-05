import type { BaseGameState, Player } from './core';

export type TowerWarAction = 'build' | 'attack' | 'defend';

export interface PlayerState {
  tower: number;      // 0-10
  defense: boolean;   // aktív-e védekezés
  attacksRemaining: number; // hátralévő támadások (max 10)
}

export interface TowerWarGameState extends BaseGameState {
  players: Record<Player, PlayerState>;
  turnCount: number;
}

export interface TowerWarMoveData {
  action: TowerWarAction;
  player: Player;
}

export const initialTowerWarGameState: TowerWarGameState = {
  players: {
    red: { tower: 0, defense: false, attacksRemaining: 10 },
    blue: { tower: 0, defense: false, attacksRemaining: 10 }
  },
  turnCount: 0,
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};