import type { BaseGameState, Player } from './core';

export type CountryWarAction = 'build' | 'move' | 'merge';

export interface Territory {
  id: number;
  owner: Player | null;
  baseValue: number;
  hasBase: boolean;
  position: { x: number; y: number };
  connections: number[]; // IDs of connected territories
}

export interface CountryWarGameState extends BaseGameState {
  territories: Territory[];
  selectedTerritory: number | null;
  targetTerritory: number | null;
  actionType: CountryWarAction | null;
}

export interface CountryWarMoveData {
  action: CountryWarAction;
  fromTerritoryId: number;
  toTerritoryId?: number;
  value?: number;
  player: Player;
}

// Create the initial 8 territories in a strategic layout
export const initialCountryWarGameState: CountryWarGameState = {
  territories: [
    // Top row (Red player starts here)
    { id: 0, owner: 'red', baseValue: 5, hasBase: true, position: { x: 1, y: 0 }, connections: [1, 3] },
    { id: 1, owner: null, baseValue: 0, hasBase: false, position: { x: 2, y: 0 }, connections: [0, 2, 4] },
    { id: 2, owner: null, baseValue: 0, hasBase: false, position: { x: 3, y: 0 }, connections: [1, 5] },
    
    // Middle row
    { id: 3, owner: null, baseValue: 0, hasBase: false, position: { x: 0, y: 1 }, connections: [0, 4, 6] },
    { id: 4, owner: null, baseValue: 0, hasBase: false, position: { x: 2, y: 1 }, connections: [1, 3, 5, 7] },
    { id: 5, owner: null, baseValue: 0, hasBase: false, position: { x: 4, y: 1 }, connections: [2, 4, 7] },
    
    // Bottom row (Blue player starts here)
    { id: 6, owner: null, baseValue: 0, hasBase: false, position: { x: 1, y: 2 }, connections: [3, 7] },
    { id: 7, owner: 'blue', baseValue: 5, hasBase: true, position: { x: 3, y: 2 }, connections: [4, 5, 6] },
  ],
  selectedTerritory: null,
  targetTerritory: null,
  actionType: null,
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};