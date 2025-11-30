import { debugLog } from '../../config/debug';
import type { ColorDuelGameState, Cell, Player, MoveData } from '../../types/colorDuel';
import type { GameSettings } from '../../types/core';
import { TurnManager } from '../../core/TurnManager';

function deriveDefaultWinLength(boardSize: number): number {
  if (boardSize <= 3) return 3;
  if (boardSize === 4) return 4;
  return 4; // default for 5x5 (can be overridden)
}

function clampWinLength(winLength: number, boardSize: number): number {
  const min = 3;
  const max = boardSize;
  return Math.max(min, Math.min(max, winLength));
}

export function checkWinner(board: Cell[][], boardSize: number, winLength: number): Player | null {
  // Check rows
  for (let i = 0; i < boardSize; i++) {
    let consecutiveCount = 1;
    let currentPlayer = board[i][0];
    if (currentPlayer === 'empty') continue;
    for (let j = 1; j < boardSize; j++) {
      if (board[i][j] === currentPlayer) {
        consecutiveCount++;
        if (consecutiveCount >= winLength) {
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
        if (consecutiveCount >= winLength) {
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
  for (let i = 0; i <= boardSize - winLength; i++) {
    for (let j = 0; j <= boardSize - winLength; j++) {
      let consecutiveCount = 1;
      let currentPlayer = board[i][j];
      if (currentPlayer === 'empty') continue;
      // First segment up to winLength
      for (let k = 1; k < winLength; k++) {
        if (board[i + k][j + k] === currentPlayer) {
          consecutiveCount++;
        } else {
          break;
        }
      }
      if (consecutiveCount >= winLength) return currentPlayer as Player;
      // Longer
      for (let k = winLength; i + k < boardSize && j + k < boardSize; k++) {
        if (board[i + k][j + k] === currentPlayer) {
          consecutiveCount++;
          if (consecutiveCount >= winLength) return currentPlayer as Player;
        } else {
          break;
        }
      }
    }
  }

  // Check diagonals (top-right → bottom-left)
  for (let i = 0; i <= boardSize - winLength; i++) {
    for (let j = winLength - 1; j < boardSize; j++) {
      let consecutiveCount = 1;
      let currentPlayer = board[i][j];
      if (currentPlayer === 'empty') continue;
      // First segment up to winLength
      for (let k = 1; k < winLength; k++) {
        if (board[i + k][j - k] === currentPlayer) {
          consecutiveCount++;
        } else {
          break;
        }
      }
      if (consecutiveCount >= winLength) return currentPlayer as Player;
      // Longer
      for (let k = winLength; i + k < boardSize && j - k >= 0; k++) {
        if (board[i + k][j - k] === currentPlayer) {
          consecutiveCount++;
          if (consecutiveCount >= winLength) return currentPlayer as Player;
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
  newState.winner = checkWinner(newState.board, newState.boardSize, newState.winLength);
  
  return newState;
}

export function resetGame(gameSettings: GameSettings): ColorDuelGameState {
  const boardSize = gameSettings.colorDuelSettings?.boardSize ?? 3;
  const stealsPerPlayer = gameSettings.colorDuelSettings?.stealsPerPlayer ?? 1;
  const rawWinLength = gameSettings.colorDuelSettings?.winLength ?? deriveDefaultWinLength(boardSize);
  const winLength = clampWinLength(rawWinLength, boardSize);
  const now = Date.now();
  
  return {
    board: Array(boardSize).fill(null).map(() => Array(boardSize).fill('empty')),
    currentTurn: 'red',
    stealsUsed: { red: 0, blue: 0 },
    maxSteals: stealsPerPlayer,
    boardSize: boardSize,
    winLength,
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
