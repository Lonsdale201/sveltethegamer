<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PlayerInfo, GameSettings, Player } from '../../types/core';
  import type { TorpedoGameState, TorpedoMoveData, Coord } from '../../types/torpedo';

  export let gameState: TorpedoGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  let selectedShipSize: number | null = null;
  let firstCoord: Coord | null = null;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: boardSize = gameState.boardSize;
  $: availableShips = gameState.availableShips.filter(
    (s) => !gameState.shipsPlaced[myColor].some((p) => p.size === s)
  );
  $: phase = gameState.phase;

  function selectShip(size: number) {
    selectedShipSize = size;
    firstCoord = null;
  }

  function handleOwnCellClick(x: number, y: number) {
    if (phase !== 'placement') return;
    if (!selectedShipSize) return;

    if (!firstCoord) {
      firstCoord = { x, y };
    } else {
      const second: Coord = { x, y };
      const move: TorpedoMoveData = { type: 'placeShip', start: firstCoord, end: second, player: myColor };
      dispatch('move', move);
      firstCoord = null;
      selectedShipSize = null;
    }
  }

  function handleEnemyCellClick(x: number, y: number) {
    if (phase !== 'battle') return;
    const move: TorpedoMoveData = { type: 'fire', target: { x, y }, player: myColor };
    dispatch('move', move);
  }

  function cellShipOwner(x: number, y: number, player: Player) {
    const cell = gameState.boards[player].grid[x][y];
    return cell.hasShip ? player : null;
  }

  function cellHit(x: number, y: number, player: Player) {
    return gameState.boards[player].grid[x][y].hit;
  }

  function shotStatusOnEnemy(x: number, y: number) {
    return gameState.shotsFired[myColor].find((s) => s.x === x && s.y === y);
  }
</script>

<div class="torpedo-wrapper">
  <div class="header">
    <div class="status">
      <div class="phase">Phase: {phase === 'placement' ? 'Placement' : 'Battle'}</div>
      {#if phase === 'battle'}
        <div class="turn">Turn: {gameState.currentTurn === myColor ? 'Your shot' : 'Opponent turn'}</div>
      {:else}
        <div class="turn">Place your ships ({gameState.shipsPlaced[myColor].length}/{gameState.availableShips.length})</div>
      {/if}
    </div>
    <div class="players">
      <div class="player-tag you">{myPlayerInfo?.name || 'You'} ({myColor})</div>
      <div class="player-tag opp">{opponentInfo?.name || 'Opponent'} ({opponentColor})</div>
    </div>
  </div>

  <div class="boards">
    <div class="board-panel enemy">
      <h3>Enemy Waters</h3>
      <div class="board" style={`--cols:${boardSize};`}>
        <div class="corner"></div>
        {#each Array(boardSize) as _, idx}
          <div class="label top">{idx + 1}</div>
        {/each}
        {#each Array(boardSize) as _, row}
          <div class="label left">{letters[row]}</div>
          {#each Array(boardSize) as _, col}
            <div
              class="cell enemy-cell {col === boardSize - 1 ? 'last-col' : ''} {row === boardSize - 1 ? 'last-row' : ''}"
              on:click={() => handleEnemyCellClick(row, col)}
            >
              {#if shotStatusOnEnemy(row, col)}
                <span class:hit={shotStatusOnEnemy(row, col)?.hit} class:miss={!shotStatusOnEnemy(row, col)?.hit}></span>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>

    <div class="board-panel own">
      <h3>Your Fleet</h3>
      <div class="board" style={`--cols:${boardSize};`}>
        <div class="corner"></div>
        {#each Array(boardSize) as _, idx}
          <div class="label top">{idx + 1}</div>
        {/each}
        {#each Array(boardSize) as _, row}
          <div class="label left">{letters[row]}</div>
          {#each Array(boardSize) as _, col}
            <div
              class="cell own-cell {col === boardSize - 1 ? 'last-col' : ''} {row === boardSize - 1 ? 'last-row' : ''}"
              on:click={() => handleOwnCellClick(row, col)}
            >
              {#if cellShipOwner(row, col, myColor)}
                <div class="ship {myColor}"></div>
              {/if}
              {#if cellHit(row, col, myColor)}
                <div class="hit-marker"></div>
              {/if}
            </div>
          {/each}
        {/each}
      </div>

      {#if phase === 'placement'}
        <div class="ships">
          <h4>Select ship size, then click start and end cells</h4>
          <div class="ship-list">
            {#each gameState.availableShips as size}
              <button
                class:selected={selectedShipSize === size}
                disabled={gameState.shipsPlaced[myColor].some((s) => s.size === size)}
                on:click={() => selectShip(size)}
              >
                {size}-cell ship
              </button>
            {/each}
          </div>
          {#if firstCoord}
            <div class="hint">Select end cell for size {selectedShipSize}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .torpedo-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    color: #0f172a;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .status {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-weight: 600;
  }
  .players {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .player-tag {
    padding: 0.4rem 0.75rem;
    border-radius: 12px;
    font-weight: 600;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #0f172a;
  }
  .boards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .board-panel {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  }
  .board {
    --cell: 40px;
    --label: 32px;
    display: grid;
    grid-template-columns: var(--label) repeat(var(--cols), var(--cell));
    grid-auto-rows: var(--cell);
    gap: 0;
    border-top: 1px solid #d1d5db;
    border-left: 1px solid #d1d5db;
    background: #fff;
  }
  .corner {
    width: var(--label);
    height: var(--cell);
  }
  .label {
    text-align: center;
    font-size: 0.85rem;
    color: #475569;
    line-height: var(--cell);
  }
  .cell {
    width: var(--cell);
    height: var(--cell);
    background: #f8fafc;
    position: relative;
    cursor: pointer;
    border-right: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
    transition: background 0.12s ease, transform 0.1s ease;
  }
  .cell:hover {
    background: #e0e7ff;
    transform: translateY(-1px);
  }
  .enemy-cell {
    background: #fff;
  }
  .cell.last-col {
    border-right: 1px solid #d1d5db;
  }
  .cell.last-row {
    border-bottom: 1px solid #d1d5db;
  }
  .ship {
    position: absolute;
    inset: 6px;
    border: 2px solid rgba(59,130,246,0.8);
    background: rgba(59,130,246,0.18);
    border-radius: 6px;
  }
  .ship.red { border-color: rgba(239,68,68,0.8); background: rgba(239,68,68,0.18); }
  .ship.blue { border-color: rgba(59,130,246,0.8); background: rgba(59,130,246,0.18); }
  .hit-marker {
    position: absolute;
    inset: 10px;
    border-radius: 999px;
    background: #dc2626;
  }
  .enemy-cell span {
    position: absolute;
    inset: 10px;
    border-radius: 999px;
    background: #94a3b8;
  }
  .enemy-cell span.hit { background: #dc2626; }
  .enemy-cell span.miss { background: #cbd5e1; opacity: 0.8; }
  .ships {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .ship-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ship-list button {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    cursor: pointer;
    background: #fff;
    color: #0f172a;
    transition: all 0.15s ease;
  }
  .ship-list button.selected {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    background: #e0f2fe;
  }
  .ship-list button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .hint {
    font-size: 0.9rem;
    color: #2563eb;
  }
  @media (max-width: 960px) {
    .boards {
      grid-template-columns: 1fr;
    }
    .board {
      --cell: 32px;
      --label: 28px;
    }
  }
</style>
