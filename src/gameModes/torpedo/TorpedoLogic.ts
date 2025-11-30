import { debugLog } from '../../config/debug';
import type { GameSettings, Player } from '../../types/core';
import type {
  TorpedoBoard,
  TorpedoCell,
  TorpedoGameState,
  TorpedoMoveData,
  ShipPlacement,
  Coord
} from '../../types/torpedo';
import { TurnManager } from '../../core/TurnManager';
import { initialTorpedoGameState } from '../../types/torpedo';

function createEmptyBoard(size: number): TorpedoBoard {
  return {
    grid: Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => ({ hasShip: false, hit: false } as TorpedoCell))
      )
  };
}

function isWithinBoard(coord: Coord, size: number): boolean {
  return coord.x >= 0 && coord.x < size && coord.y >= 0 && coord.y < size;
}

function placeShip(board: TorpedoBoard, placement: ShipPlacement) {
  for (const cell of placement.cells) {
    board.grid[cell.x][cell.y] = {
      hasShip: true,
      hit: false,
      shipId: placement.id
    };
  }
}

function allShipsSunk(board: TorpedoBoard, ships: ShipPlacement[]): boolean {
  for (const ship of ships) {
    const sunk = ship.cells.every((c) => board.grid[c.x][c.y].hit);
    if (!sunk) return false;
  }
  return ships.length > 0;
}

function nextTurn(player: Player): Player {
  return player === 'red' ? 'blue' : 'red';
}

function computePlacementCells(start: Coord, end: Coord, size: number, boardSize: number): Coord[] | null {
  let dx = end.y - start.y;
  let dy = end.x - start.x;

  if (Math.abs(dx) >= Math.abs(dy)) {
    dy = 0;
    dx = dx === 0 ? 1 : dx > 0 ? 1 : -1;
  } else {
    dx = 0;
    dy = dy === 0 ? 1 : dy > 0 ? 1 : -1;
  }

  const cells: Coord[] = [];
  for (let i = 0; i < size; i++) {
    const x = start.x + dy * i;
    const y = start.y + dx * i;
    if (!isWithinBoard({ x, y }, boardSize)) return null;
    cells.push({ x, y });
  }
  return cells;
}

export function canMakeMove(gameState: TorpedoGameState, moveData: TorpedoMoveData, player: Player): boolean {
  if (gameState.winner || !gameState.gameStarted) return false;

  if (moveData.type === 'placeShip') {
    if (gameState.phase !== 'placement') return false;
    const remaining = gameState.availableShips.filter(
      (size) => !gameState.shipsPlaced[player].some((s) => s.size === size)
    );
    const requestedSize =
      moveData.size ?? Math.max(Math.abs(moveData.end.x - moveData.start.x), Math.abs(moveData.end.y - moveData.start.y)) + 1;
    if (!remaining.includes(requestedSize)) return false;

    const cells = computePlacementCells(moveData.start, moveData.end, requestedSize, gameState.boardSize);
    if (!cells) return false;

    for (const c of cells) {
      if (gameState.boards[player].grid[c.x][c.y].hasShip) return false;
    }
    return true;
  }

  if (moveData.type === 'fire') {
    if (gameState.phase !== 'battle') return false;
    if (gameState.currentTurn !== player) return false;
    if (!isWithinBoard(moveData.target, gameState.boardSize)) return false;
    const alreadyShot = gameState.shotsFired[player].some(
      (s) => s.x === moveData.target.x && s.y === moveData.target.y
    );
    return !alreadyShot;
  }

  return false;
}

export function makeMove(gameState: TorpedoGameState, moveData: TorpedoMoveData, player: Player): TorpedoGameState {
  if (!canMakeMove(gameState, moveData, player)) {
    debugLog('Torpedo makeMove: invalid move', moveData);
    return gameState;
  }

  const newState: TorpedoGameState = {
    ...gameState,
    boards: {
      red: { grid: gameState.boards.red.grid.map((row) => row.map((c) => ({ ...c }))) },
      blue: { grid: gameState.boards.blue.grid.map((row) => row.map((c) => ({ ...c }))) }
    },
    shipsPlaced: {
      red: [...gameState.shipsPlaced.red],
      blue: [...gameState.shipsPlaced.blue]
    },
    shotsFired: {
      red: [...gameState.shotsFired.red],
      blue: [...gameState.shotsFired.blue]
    }
  };

  if (moveData.type === 'placeShip') {
    const length =
      moveData.size ?? Math.max(Math.abs(moveData.end.x - moveData.start.x), Math.abs(moveData.end.y - moveData.start.y)) + 1;
    const cells = computePlacementCells(moveData.start, moveData.end, length, newState.boardSize);
    if (!cells) {
      debugLog('Torpedo makeMove: invalid placement cells', moveData);
      return gameState;
    }

    const placement: ShipPlacement = {
      id: `${player}-${length}-${newState.shipsPlaced[player].length + 1}`,
      size: length,
      start: moveData.start,
      end: moveData.end,
      cells
    };

    placeShip(newState.boards[player], placement);
    newState.shipsPlaced[player].push(placement);

    const allRedReady = newState.shipsPlaced.red.length === newState.availableShips.length;
    const allBlueReady = newState.shipsPlaced.blue.length === newState.availableShips.length;

    if (allRedReady && allBlueReady) {
      newState.phase = 'battle';
      newState.currentTurn = 'red';
      newState.turnStartTime = Date.now();
      newState.turnTimeLimit = gameState.turnTimeLimit === newState.prepTimeLimit ? 0 : gameState.turnTimeLimit;
      newState.timeRemaining = newState.turnTimeLimit;
    }

    return newState;
  }

  if (moveData.type === 'fire') {
    const targetBoardOwner: Player = player === 'red' ? 'blue' : 'red';
    const cell = newState.boards[targetBoardOwner].grid[moveData.target.x][moveData.target.y];
    const hit = cell.hasShip;

    if (hit) {
      cell.hit = true;
    }

    newState.shotsFired[player].push({
      x: moveData.target.x,
      y: moveData.target.y,
      hit
    });

    if (allShipsSunk(newState.boards[targetBoardOwner], newState.shipsPlaced[targetBoardOwner])) {
      newState.winner = player;
    } else {
      newState.currentTurn = nextTurn(player);
      newState.turnStartTime = Date.now();
      newState.timeRemaining = gameState.turnTimeLimit;
    }

    return newState;
  }

  return newState;
}

export function resetGame(gameSettings: GameSettings): TorpedoGameState {
  const boardSize = gameSettings.torpedoSettings?.boardSize ?? 10;
  const prepTimeLimit = gameSettings.torpedoSettings?.prepTimeLimit ?? 20;
  const now = Date.now();

  const emptyBoardRed = createEmptyBoard(boardSize);
  const emptyBoardBlue = createEmptyBoard(boardSize);

  return {
    ...initialTorpedoGameState,
    boardSize,
    prepTimeLimit,
    boards: { red: emptyBoardRed, blue: emptyBoardBlue },
    shipsPlaced: { red: [], blue: [] },
    shotsFired: { red: [], blue: [] },
    phase: 'placement',
    prepStartTime: now,
    gameStarted: true,
    turnStartTime: now,
    turnTimeLimit: prepTimeLimit,
    timeRemaining: prepTimeLimit,
    turnState: TurnManager.initializeTurnState('sequential')
  };
}

export function skipTurn(gameState: TorpedoGameState): TorpedoGameState {
  const newState = { ...gameState };
  const now = Date.now();

  if (gameState.phase === 'placement') {
    // Prep timeout: start battle with whatever is placed
    newState.phase = 'battle';
    newState.currentTurn = 'red';
    newState.turnStartTime = now;
    newState.turnTimeLimit = gameState.turnTimeLimit === gameState.prepTimeLimit ? 0 : gameState.turnTimeLimit;
    newState.timeRemaining = newState.turnTimeLimit;
    return newState;
  }

  // Battle phase timeout: just switch turn
  newState.currentTurn = newState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  return newState;
}
