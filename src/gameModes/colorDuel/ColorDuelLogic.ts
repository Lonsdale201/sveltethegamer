import { debugLog } from '../../config/debug';
import type { ColorDuelGameState, Cell, Player, MoveData } from '../../types/colorDuel';
import type { GameSettings } from '../../types/core';
import { TurnManager } from '../../core/TurnManager';

export function checkWinner(board: Cell[][], boardSize: number): Player | null {
  // Check rows
  for (let i = 0; i < boardSize; i++) {
    let consecutiveCount = 1;
    let currentPlayer = board[i][0];
    if (currentPlayer === 'empty') continue;
    for (let j = 1; j < boardSize; j++) {
      if (board[i][j] === currentPlayer) {
        consecutiveCount++;
        if (consecutiveCount >= 3) {
          return currentPlayer as Player;
        }
      } else {
        consecutiveCount = 1;
        currentPlayer = board[i][j];
        if (currentPlayer === 'empty') break;
      }
    }
  }

  // Check columns
  for (let j = 0; j < boardSize; j++) {
    let consecutiveCount = 1;
    let currentPlayer = board[0][j];
    if (currentPlayer === 'empty') continue;
    for (let i = 1; i < boardSize; i++) {
      if (board[i][j] === currentPlayer) {
        consecutiveCount++;
        if (consecutiveCount >= 3) {
          return currentPlayer as Player;
        }
      } else {
        consecutiveCount = 1;
        currentPlayer = board[i][j];
        if (currentPlayer === 'empty') break;
      }
    }
  }

  // Check diagonals (top-left → bottom-right)
  for (let i = 0; i <= boardSize - 3; i++) {
    for (let j = 0; j <= boardSize - 3; j++) {
      let consecutiveCount = 1;
      let currentPlayer = board[i][j];
      if (currentPlayer === 'empty') continue;
      // First 3
      for (let k = 1; k < 3; k++) {
        if (board[i + k][j + k] === currentPlayer) {
          consecutiveCount++;
        } else {
          break;
        }
      }
      if (consecutiveCount >= 3) return currentPlayer as Player;
      // Longer
      for (let k = 3; i + k < boardSize && j + k < boardSize; k++) {
        if (board[i + k][j + k] === currentPlayer) {
          consecutiveCount++;
          if (consecutiveCount >= 3) return currentPlayer as Player;
        } else {
          break;
        }
      }
    }
  }

  // Check diagonals (top-right → bottom-left)
  for (let i = 0; i <= boardSize - 3; i++) {
    for (let j = 2; j < boardSize; j++) {
      let consecutiveCount = 1;
      let currentPlayer = board[i][j];
      if (currentPlayer === 'empty') continue;
      // First 3
      for (let k = 1; k < 3; k++) {
        if (board[i + k][j - k] === currentPlayer) {
          consecutiveCount++;
        } else {
          break;
        }
      }
      if (consecutiveCount >= 3) return currentPlayer as Player;
      // Longer
      for (let k = 3; i + k < boardSize && j - k >= 0; k++) {
        if (board[i + k][j - k] === currentPlayer) {
          consecutiveCount++;
          if (consecutiveCount >= 3) return currentPlayer as Player;
        } else {
          break;
        }
      }
    }
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
  if (x < 0 || x >= gameState.boardSize || y < 0 || y >= gameState.boardSize) return false;

  const cell = gameState.board[x][y];
  debugLog('  cell at [' + x + ',' + y + ']:', cell);
  debugLog('  player steals used:', gameState.stealsUsed[player]);
  debugLog('  max steals allowed:', gameState.maxSteals);
  
  // Can place on empty cell
  if (cell === 'empty') {
    debugLog('canMakeMove: Allowing move on empty cell');
    return true;
  }
  
  // Can steal opponent's cell if haven't used all steals
  if (cell !== player && gameState.stealsUsed[player] < gameState.maxSteals) {
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
    newState.stealsUsed = { ...newState.stealsUsed, [player]: newState.stealsUsed[player] + 1 };
  }
  
  const now = Date.now();
  newState.currentTurn = player === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  newState.winner = checkWinner(newState.board, newState.boardSize);
  
  return newState;
}

export function resetGame(gameSettings: GameSettings): ColorDuelGameState {
  const boardSize = gameSettings.colorDuelSettings?.boardSize ?? 3;
  const stealsPerPlayer = gameSettings.colorDuelSettings?.stealsPerPlayer ?? 1;
  const now = Date.now();
  
  return {
    board: Array(boardSize).fill(null).map(() => Array(boardSize).fill('empty')),
    currentTurn: 'red',
    stealsUsed: { red: 0, blue: 0 },
    maxSteals: stealsPerPlayer,
    boardSize: boardSize,
    winner: null,
    gameStarted: true,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
    turnState: TurnManager.initializeTurnState('sequential'),
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
