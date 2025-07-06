import { debugLog } from '../../config/debug';
import type { TowerWarGameState, TowerWarAction, Player, TowerWarMoveData } from '../../types/towerWar';
import type { GameSettings } from '../../types/core';

export function checkWinner(gameState: TowerWarGameState): Player | null {
  const redPlayer = gameState.players.red;
  const bluePlayer = gameState.players.blue;
  
  // Check if someone reached 10 levels
  if (redPlayer.tower >= 10) return 'red';
  if (bluePlayer.tower >= 10) return 'blue';
  
  // Check if someone's tower collapsed (0 levels) - but only after at least 2 turns
  // This ensures both players have had at least one chance to play
  const gameHasProgressed = gameState.turnCount >= 2;
  
  if (gameHasProgressed) {
    if (redPlayer.tower <= 0 && bluePlayer.tower > 0) return 'blue';
    if (bluePlayer.tower <= 0 && redPlayer.tower > 0) return 'red';
  }
  
  return null;
}

export function canMakeAction(gameState: TowerWarGameState, action: TowerWarAction, player: Player): boolean {
  debugLog('TowerWar canMakeAction:', { action, player, gameState });
  
  if (gameState.winner || !gameState.gameStarted) return false;
  if (gameState.currentTurn !== player) return false;
  
  const playerState = gameState.players[player];
  
  switch (action) {
    case 'build':
      return playerState.tower < 10;
    case 'attack':
      return playerState.tower >= 3 && playerState.attacksRemaining > 0;
    case 'defend':
      return !playerState.defense;
    default:
      return false;
  }
}

export function makeMove(gameState: TowerWarGameState, action: TowerWarAction, player: Player): TowerWarGameState {
  if (!canMakeAction(gameState, action, player)) {
    debugLog('TowerWar makeMove: Invalid action attempted by', player, 'action:', action);
    return gameState;
  }

  debugLog('TowerWar makeMove: Valid action by', player, 'action:', action);
  
  const newState = { ...gameState };
  newState.players = {
    red: { ...gameState.players.red },
    blue: { ...gameState.players.blue }
  };
  
  const currentPlayer = newState.players[player];
  const opponent = player === 'red' ? 'blue' : 'red';
  const opponentPlayer = newState.players[opponent];
  
  switch (action) {
    case 'build':
      currentPlayer.tower = Math.min(10, currentPlayer.tower + 1);
      break;
      
    case 'attack':
      // Consume one attack
      currentPlayer.attacksRemaining = Math.max(0, currentPlayer.attacksRemaining - 1);
      
      if (opponentPlayer.defense) {
        // Defense blocks the attack
        opponentPlayer.defense = false;
        debugLog('TowerWar: Attack blocked by defense, attacks remaining:', currentPlayer.attacksRemaining);
      } else {
        // Attack hits
        opponentPlayer.tower = Math.max(0, opponentPlayer.tower - 1);
        debugLog('TowerWar: Attack successful, opponent tower:', opponentPlayer.tower, 'attacks remaining:', currentPlayer.attacksRemaining);
      }
      break;
      
    case 'defend':
      currentPlayer.defense = true;
      break;
  }
  
  const now = Date.now();
  newState.currentTurn = player === 'red' ? 'blue' : 'red';
  newState.turnCount = gameState.turnCount + 1;
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  newState.winner = checkWinner(newState);
  
  debugLog('TowerWar makeMove result:', newState);
  return newState;
}

export function resetGame(gameSettings: GameSettings): TowerWarGameState {
  const maxAttacks = gameSettings.towerWarSettings?.maxAttacks ?? 10;
  const now = Date.now();
  return {
    players: {
      red: { tower: 0, defense: false, attacksRemaining: maxAttacks },
      blue: { tower: 0, defense: false, attacksRemaining: maxAttacks }
    },
    turnCount: 0,
    currentTurn: 'red',
    winner: null,
    gameStarted: true,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
  };
}

export function skipTurn(gameState: TowerWarGameState): TowerWarGameState {
  const newState = { ...gameState };
  const now = Date.now();
  
  // Switch to next player
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnCount = gameState.turnCount + 1;
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  
  return newState;
}