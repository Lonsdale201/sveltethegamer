import { debugLog } from '../../config/debug';
import type { ShadowCodeGameState, ShadowCodeMoveData, GuessResult } from '../../types/shadowCode';
import type { GameSettings } from '../../types/core';
import type { Player } from '../../types/core';
import { TurnManager } from '../../core/TurnManager';

export function checkWinner(gameState: ShadowCodeGameState): Player | null {
  // Check if someone guessed the opponent's code correctly
  for (const player of ['red', 'blue'] as Player[]) {
    const playerGuesses = gameState.guesses[player];
    if (playerGuesses.length > 0) {
      const lastGuess = playerGuesses[playerGuesses.length - 1];
      if (lastGuess.exactMatches === 3) {
        return player;
      }
    }
  }
  
  return null;
}

export function canMakeMove(gameState: ShadowCodeGameState, moveData: ShadowCodeMoveData, player: Player): boolean {
  debugLog('ShadowCode canMakeMove:', { moveData, player, gameState });
  
  if (gameState.winner) return false;
  
  if (moveData.type === 'setCode') {
    // Can set code if not already set and game hasn't started
    return !gameState.codeSet[player] && !gameState.gameStarted;
  }
  
  if (moveData.type === 'makeGuess') {
    // Can make guess if it's player's turn, game started, and both codes are set
    return gameState.gameStarted && 
           gameState.currentTurn === player && 
           gameState.codeSet.red && 
           gameState.codeSet.blue;
  }
  
  return false;
}

export function makeMove(gameState: ShadowCodeGameState, moveData: ShadowCodeMoveData, player: Player): ShadowCodeGameState {
  if (!canMakeMove(gameState, moveData, player)) {
    debugLog('ShadowCode makeMove: Invalid move attempted by', player, 'moveData:', moveData);
    return gameState;
  }

  debugLog('ShadowCode makeMove: Valid move by', player, 'moveData:', moveData);
  
  const newState = { ...gameState };
  newState.playerCodes = { ...gameState.playerCodes };
  newState.guesses = { 
    red: [...gameState.guesses.red], 
    blue: [...gameState.guesses.blue] 
  };
  newState.currentGuess = { ...gameState.currentGuess };
  newState.codeSet = { ...gameState.codeSet };
  
  if (moveData.type === 'setCode' && moveData.code) {
    newState.playerCodes[player] = [...moveData.code];
    newState.codeSet[player] = true;
    
    // Start game if both players have set their codes
    if (newState.codeSet.red && newState.codeSet.blue && !newState.gameStarted) {
      newState.gameStarted = true;
      const now = Date.now();
      newState.turnStartTime = now;
      newState.timeRemaining = gameState.turnTimeLimit;
    }
  }
  
  if (moveData.type === 'makeGuess' && moveData.guess) {
    const opponent = player === 'red' ? 'blue' : 'red';
    const opponentCode = gameState.playerCodes[opponent];
    
    // Calculate exact and partial matches
    const guessResult = calculateMatches(moveData.guess, opponentCode);
    
    newState.guesses[player].push({
      guess: [...moveData.guess],
      exactMatches: guessResult.exactMatches,
      partialMatches: guessResult.partialMatches,
      timestamp: Date.now()
    });
    
    // Switch turns
    const now = Date.now();
    newState.currentTurn = opponent;
    newState.turnStartTime = now;
    newState.timeRemaining = gameState.turnTimeLimit;
    
    // Check for winner
    newState.winner = checkWinner(newState);
  }
  
  return newState;
}

function calculateMatches(guess: number[], code: number[]): { exactMatches: number; partialMatches: number } {
  let exactMatches = 0;
  let partialMatches = 0;
  
  const codeUsed = new Array(3).fill(false);
  const guessUsed = new Array(3).fill(false);
  
  // First pass: count exact matches
  for (let i = 0; i < 3; i++) {
    if (guess[i] === code[i]) {
      exactMatches++;
      codeUsed[i] = true;
      guessUsed[i] = true;
    }
  }
  
  // Second pass: count partial matches
  for (let i = 0; i < 3; i++) {
    if (!guessUsed[i]) {
      for (let j = 0; j < 3; j++) {
        if (!codeUsed[j] && guess[i] === code[j]) {
          partialMatches++;
          codeUsed[j] = true;
          break;
        }
      }
    }
  }
  
  return { exactMatches, partialMatches };
}

export function resetGame(gameSettings: GameSettings): ShadowCodeGameState {
  const now = Date.now();
  return {
    playerCodes: { red: [], blue: [] },
    guesses: { red: [], blue: [] },
    currentGuess: { red: [1, 1, 1], blue: [1, 1, 1] },
    codeSet: { red: false, blue: false },
    gameStarted: false,
    currentTurn: 'red',
    winner: null,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
    turnState: TurnManager.initializeTurnState('sequential'),
  };
}

export function skipTurn(gameState: ShadowCodeGameState): ShadowCodeGameState {
  const newState = { ...gameState };
  const now = Date.now();
  
  // Switch to next player
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  
  return newState;
}