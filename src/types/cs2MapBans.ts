import type { BaseGameState, Player } from './core';

export interface MapBan {
  name: string;
  bannedBy: Player;
  round: number;
}

export interface CS2MapBansGameState extends BaseGameState {
  maps: string[];
  bannedMaps: MapBan[];
  currentRound: number;
  bansPerRound: number[];
  winningMap: string | null;
}

export interface CS2MapBansMoveData {
  type: 'submitBans';
  bans: string[];
  player: Player;
}

export const initialCS2MapBansGameState: CS2MapBansGameState = {
  maps: [],
  bannedMaps: [],
  currentRound: 0,
  bansPerRound: [],
  winningMap: null,
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};
