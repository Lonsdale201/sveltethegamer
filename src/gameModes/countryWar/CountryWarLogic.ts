import type { CountryWarGameState, CountryWarAction, CountryWarMoveData, Territory } from '../../types/countryWar';
import type { GameSettings } from '../../types/core';
import type { Player } from '../../types/core';

export function checkWinner(gameState: CountryWarGameState): Player | null {
  const redTerritories = gameState.territories.filter(t => t.owner === 'red').length;
  const blueTerritories = gameState.territories.filter(t => t.owner === 'blue').length;
  
  // Win by controlling majority of territories (5 or more out of 8)
  if (redTerritories >= 5) return 'red';
  if (blueTerritories >= 5) return 'blue';
  
  // Win by eliminating all opponent bases
  const redBases = gameState.territories.filter(t => t.owner === 'red' && t.hasBase).length;
  const blueBases = gameState.territories.filter(t => t.owner === 'blue' && t.hasBase).length;
  
  if (redBases === 0 && blueBases > 0) return 'blue';
  if (blueBases === 0 && redBases > 0) return 'red';
  
  return null;
}

export function canMakeMove(gameState: CountryWarGameState, moveData: CountryWarMoveData, player: Player): boolean {
  console.log('CountryWar canMakeMove:', { moveData, player, gameState });
  
  if (gameState.winner || !gameState.gameStarted) return false;
  if (gameState.currentTurn !== player) return false;
  
  const fromTerritory = gameState.territories.find(t => t.id === moveData.fromTerritoryId);
  if (!fromTerritory || fromTerritory.owner !== player) return false;
  
  switch (moveData.action) {
    case 'build':
      // Can build a base if territory doesn't have one and has at least 10 value
      return !fromTerritory.hasBase && fromTerritory.baseValue >= 10;
      
    case 'move':
      if (!moveData.toTerritoryId) return false;
      const toTerritory = gameState.territories.find(t => t.id === moveData.toTerritoryId);
      if (!toTerritory) return false;
      
      // Must be connected territories
      if (!fromTerritory.connections.includes(toTerritory.id)) return false;
      
      // Must have a base to send from and enough value
      if (!fromTerritory.hasBase || fromTerritory.baseValue <= 1) return false;
      
      return true;
      
    case 'merge':
      if (!moveData.toTerritoryId) return false;
      const mergeTarget = gameState.territories.find(t => t.id === moveData.toTerritoryId);
      if (!mergeTarget) return false;
      
      // Both territories must be owned by player and have bases
      if (mergeTarget.owner !== player || !mergeTarget.hasBase || !fromTerritory.hasBase) return false;
      
      // Must be connected
      if (!fromTerritory.connections.includes(mergeTarget.id)) return false;
      
      return true;
      
    default:
      return false;
  }
}

export function makeMove(gameState: CountryWarGameState, moveData: CountryWarMoveData, player: Player): CountryWarGameState {
  if (!canMakeMove(gameState, moveData, player)) {
    console.log('CountryWar makeMove: Invalid move attempted by', player, 'moveData:', moveData);
    return gameState;
  }

  console.log('CountryWar makeMove: Valid move by', player, 'moveData:', moveData);
  
  const newState = { ...gameState };
  newState.territories = gameState.territories.map(t => ({ ...t }));
  
  const fromTerritory = newState.territories.find(t => t.id === moveData.fromTerritoryId)!;
  
  switch (moveData.action) {
    case 'build':
      // Build a base, costs 10 value
      fromTerritory.hasBase = true;
      fromTerritory.baseValue -= 10;
      break;
      
    case 'move':
      const toTerritory = newState.territories.find(t => t.id === moveData.toTerritoryId!)!;
      const moveValue = fromTerritory.baseValue - 1; // Leave 1 behind
      
      if (toTerritory.owner === player) {
        // Moving to own territory - add values
        toTerritory.baseValue += moveValue;
      } else if (toTerritory.owner === null) {
        // Conquering neutral territory
        toTerritory.owner = player;
        toTerritory.baseValue = moveValue;
      } else {
        // Attacking enemy territory
        if (moveValue > toTerritory.baseValue) {
          // Successful attack
          toTerritory.owner = player;
          toTerritory.baseValue = moveValue - toTerritory.baseValue;
        } else {
          // Failed attack
          toTerritory.baseValue -= moveValue;
          if (toTerritory.baseValue <= 0) {
            toTerritory.owner = null;
            toTerritory.baseValue = 0;
            toTerritory.hasBase = false;
          }
        }
      }
      
      fromTerritory.baseValue = 1; // Leave 1 behind
      break;
      
    case 'merge':
      const mergeTarget = newState.territories.find(t => t.id === moveData.toTerritoryId!)!;
      // Merge all value from source to target
      mergeTarget.baseValue += fromTerritory.baseValue;
      fromTerritory.baseValue = 0;
      fromTerritory.hasBase = false;
      fromTerritory.owner = null;
      break;
  }
  
  const now = Date.now();
  newState.currentTurn = player === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  newState.winner = checkWinner(newState);
  newState.selectedTerritory = null;
  newState.targetTerritory = null;
  newState.actionType = null;
  
  return newState;
}

export function resetGame(gameSettings: GameSettings): CountryWarGameState {
  const now = Date.now();
  return {
    territories: [
      // Reset to initial state with starting positions
      { id: 0, owner: 'red', baseValue: 5, hasBase: true, position: { x: 1, y: 0 }, connections: [1, 3] },
      { id: 1, owner: null, baseValue: 0, hasBase: false, position: { x: 2, y: 0 }, connections: [0, 2, 4] },
      { id: 2, owner: null, baseValue: 0, hasBase: false, position: { x: 3, y: 0 }, connections: [1, 5] },
      { id: 3, owner: null, baseValue: 0, hasBase: false, position: { x: 0, y: 1 }, connections: [0, 4, 6] },
      { id: 4, owner: null, baseValue: 0, hasBase: false, position: { x: 2, y: 1 }, connections: [1, 3, 5, 7] },
      { id: 5, owner: null, baseValue: 0, hasBase: false, position: { x: 4, y: 1 }, connections: [2, 4, 7] },
      { id: 6, owner: null, baseValue: 0, hasBase: false, position: { x: 1, y: 2 }, connections: [3, 7] },
      { id: 7, owner: 'blue', baseValue: 5, hasBase: true, position: { x: 3, y: 2 }, connections: [4, 5, 6] },
    ],
    selectedTerritory: null,
    targetTerritory: null,
    actionType: null,
    gameStarted: true,
    currentTurn: 'red',
    winner: null,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
  };
}

export function skipTurn(gameState: CountryWarGameState): CountryWarGameState {
  const newState = { ...gameState };
  newState.territories = gameState.territories.map(t => ({ ...t }));
  
  // Increment base values for all territories with bases
  newState.territories.forEach(territory => {
    if (territory.hasBase && territory.owner) {
      territory.baseValue += 1;
    }
  });
  
  const now = Date.now();
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  newState.selectedTerritory = null;
  newState.targetTerritory = null;
  newState.actionType = null;
  
  return newState;
}

// Helper function to increment base values each turn
export function incrementBaseValues(gameState: CountryWarGameState): CountryWarGameState {
  const newState = { ...gameState };
  newState.territories = gameState.territories.map(t => ({ ...t }));
  
  newState.territories.forEach(territory => {
    if (territory.hasBase && territory.owner) {
      territory.baseValue += 1;
    }
  });
  
  return newState;
}