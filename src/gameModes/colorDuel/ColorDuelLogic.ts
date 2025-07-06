import { debugLog } from '../../config/debug';
import type { ColorDuelGameState, Cell, Player, MoveData } from '../../types/colorDuel';
import type { GameSettings } from '../../types/core';

export function checkWinner(board: Cell[][]): Player | null {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== 'empty' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0] as Player;
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] !== 'empty' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i] as Player;
    }
  }

  // Check diagonals
  if (board[0][0] !== 'empty' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0] as Player;
  }
  if (board[0][2] !== 'empty' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2] as Player;
  }

  return null;
}

export function canMakeMove(gameState: ColorDuelGameState, x: number, y: number, player: Player): boolean {
  debugLog('canMakeMove: Called with:', { gameState, x, y, player });
  debugLog('canMakeMove: Checking conditions:');
  debugLog('  gameState.winner:', gameState.winner);
  debugLog('  gameState.gameStarted:', gameState.gameStarted);
  debugLog('  gameState.currentTurn:', gameState.currentTurn);
  debugLog('  player:', player);
  
  if (gameState.winner || !gameState.gameStarted) return false;
  if (gameState.currentTurn !== player) return false;

  const cell = gameState.board[x][y];
  debugLog('  cell at [' + x + ',' + y + ']:', cell);
  debugLog('  player stolen status:', gameState.stolen[player]);
  
  // Can place on empty cell
  if (cell === 'empty') {
    debugLog('canMakeMove: Allowing move on empty cell');
    return true;
  }
  
  // Can steal opponent's cell if haven't stolen yet
  if (cell !== player && !gameState.stolen[player]) {
    debugLog('canMakeMove: Allowing steal move');
    return true;
  }
  
  debugLog('canMakeMove: Move not allowed');
  return false;
}

export function makeMove(gameState: ColorDuelGameState, x: number, y: number, player: Player): ColorDuelGameState {
  if (!canMakeMove(gameState, x, y, player)) {
    debugLog('makeMove: Invalid move attempted by', player, 'at', x, y);
    return gameState;
  }

  debugLog('makeMove: Valid move by', player, 'at', x, y);
  
  const newState = { ...gameState };
  newState.board = gameState.board.map(row => [...row]);
  
  const wasSteal = newState.board[x][y] !== 'empty';
  newState.board[x][y] = player;
  
  if (wasSteal) {
    newState.stolen = { ...newState.stolen, [player]: true };
  }
  
  const now = Date.now();
  newState.currentTurn = player === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  newState.winner = checkWinner(newState.board);
  
  return newState;
}

export function resetGame(gameSettings: GameSettings): ColorDuelGameState {
  const now = Date.now();
  return {
    board: Array(3).fill(null).map(() => Array(3).fill('empty')),
    currentTurn: 'red',
    stolen: { red: false, blue: false },
    winner: null,
    gameStarted: true,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
  };
}

export function skipTurn(gameState: ColorDuelGameState): ColorDuelGameState {
  const newState = { ...gameState };
  const now = Date.now();
  
  // Switch to next player
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  
  return newState;
}