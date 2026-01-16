import { debugLog } from '../../config/debug';
import { TurnManager } from '../../core/TurnManager';
import type { CS2MapBansGameState, CS2MapBansMoveData, MapBan } from '../../types/cs2MapBans';
import type { GameSettings, Player } from '../../types/core';

const DEFAULT_MAPS = ['Dust2', 'Mirage', 'Inferno', 'Train', 'Nuke', 'Ancient', 'Overpass'];
const DEFAULT_BANS_PER_ROUND = [2, 3, 1];
const DEFAULT_TURN_TIME = 20;

function getAvailableMaps(gameState: CS2MapBansGameState): string[] {
  const banned = new Set(gameState.bannedMaps.map((ban) => ban.name));
  return gameState.maps.filter((name) => !banned.has(name));
}

function getRequiredBans(gameState: CS2MapBansGameState): number {
  return gameState.bansPerRound[gameState.currentRound] ?? 0;
}

function pickRandomMaps(available: string[], count: number): string[] {
  const pool = [...available];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}

function applyBans(
  gameState: CS2MapBansGameState,
  player: Player,
  selectedBans: string[]
): CS2MapBansGameState {
  if (gameState.winningMap) {
    return gameState;
  }

  const requiredBans = getRequiredBans(gameState);
  if (requiredBans <= 0) {
    const remaining = getAvailableMaps(gameState);
    if (remaining.length > 0 && !gameState.winningMap) {
      return {
        ...gameState,
        winningMap: remaining[0],
        winner: player
      };
    }
    return gameState;
  }

  const availableMaps = getAvailableMaps(gameState);
  if (availableMaps.length === 0) {
    return gameState;
  }

  const uniqueSelections = Array.from(
    new Set(selectedBans.filter((map) => availableMaps.includes(map)))
  ).slice(0, requiredBans);

  const remainingForRandom = availableMaps.filter((map) => !uniqueSelections.includes(map));
  const randomNeeded = Math.max(0, requiredBans - uniqueSelections.length);
  const randomBans = pickRandomMaps(remainingForRandom, randomNeeded);
  const finalBans = [...uniqueSelections, ...randomBans];

  const banEntries: MapBan[] = finalBans.map((name) => ({
    name,
    bannedBy: player,
    round: gameState.currentRound + 1
  }));

  const newState: CS2MapBansGameState = {
    ...gameState,
    bannedMaps: [...gameState.bannedMaps, ...banEntries],
    currentRound: gameState.currentRound + 1
  };

  const remainingMaps = getAvailableMaps(newState);
  if (remainingMaps.length <= 1 || newState.currentRound >= newState.bansPerRound.length) {
    newState.winningMap = remainingMaps[0] ?? null;
    newState.winner = player;
  }

  return newState;
}

export function canMakeMove(
  gameState: CS2MapBansGameState,
  moveData: CS2MapBansMoveData,
  player: Player
): boolean {
  debugLog('CS2MapBans canMakeMove:', { moveData, player, gameState });

  if (!gameState.gameStarted || gameState.winner || gameState.winningMap) return false;
  if (!TurnManager.canPlayerAct(gameState, player)) return false;
  if (gameState.currentRound >= gameState.bansPerRound.length) return false;
  if (moveData.type !== 'submitBans') return false;

  const availableMaps = getAvailableMaps(gameState);
  const uniqueSelections = Array.from(new Set(moveData.bans));
  return uniqueSelections.every((map) => availableMaps.includes(map));
}

export function makeMove(
  gameState: CS2MapBansGameState,
  moveData: CS2MapBansMoveData,
  player: Player
): CS2MapBansGameState {
  if (!canMakeMove(gameState, moveData, player)) {
    debugLog('CS2MapBans makeMove: Invalid move attempted', { player, moveData });
    return gameState;
  }

  return TurnManager.handlePlayerAction(gameState, player, (state) => {
    const newState = applyBans(state, player, moveData.bans);
    debugLog('CS2MapBans makeMove: Applied bans', {
      player,
      selected: moveData.bans,
      bannedMaps: newState.bannedMaps
    });
    return newState;
  });
}

export function resetGame(gameSettings: GameSettings): CS2MapBansGameState {
  const turnTimeLimit = gameSettings.turnTimeLimit > 0 ? gameSettings.turnTimeLimit : DEFAULT_TURN_TIME;
  const now = Date.now();

  return {
    maps: [...DEFAULT_MAPS],
    bannedMaps: [],
    currentRound: 0,
    bansPerRound: [...DEFAULT_BANS_PER_ROUND],
    winningMap: null,
    gameStarted: true,
    currentTurn: 'red',
    winner: null,
    turnTimeLimit,
    turnStartTime: now,
    timeRemaining: turnTimeLimit,
    turnState: TurnManager.initializeTurnState('sequential')
  };
}

export function skipTurn(gameState: CS2MapBansGameState): CS2MapBansGameState {
  if (gameState.winner || gameState.winningMap) {
    return gameState;
  }

  return TurnManager.handleTurnTimeout(gameState, (state) => {
    const player = state.currentTurn;
    const newState = applyBans(state, player, []);
    debugLog('CS2MapBans skipTurn: Auto-banned for timeout', {
      player,
      round: state.currentRound,
      bannedMaps: newState.bannedMaps
    });
    return newState;
  });
}
