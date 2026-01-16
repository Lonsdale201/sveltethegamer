import type { BaseGameState, Player } from './core';

export interface MapBan {
  name: string;
  bannedBy: Player;
  round: number;
}

export type Side = 'CT' | 'T';

export type CS2MapBansPhase = 'bans' | 'side-selection' | 'complete';

export interface SideChoice {
  player: Player | null;
  side: Side | null;
}

export interface CS2MapBansGameState extends BaseGameState {
  maps: string[];
  bannedMaps: MapBan[];
  currentRound: number;
  bansPerRound: number[];
  winningMap: string | null;
  phase: CS2MapBansPhase;
  sideChoice: SideChoice;
}

export type CS2MapBansMoveData =
  | {
      type: 'submitBans';
      bans: string[];
      player: Player;
    }
  | {
      type: 'chooseSide';
      side: Side;
      player: Player;
    };

export const initialCS2MapBansGameState: CS2MapBansGameState = {
  maps: [],
  bannedMaps: [],
  currentRound: 0,
  bansPerRound: [],
  winningMap: null,
  phase: 'bans',
  sideChoice: { player: null, side: null },
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};
