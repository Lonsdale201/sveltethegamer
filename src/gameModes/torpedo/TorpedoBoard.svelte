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
      <div class="board">
        <div class="labels top">
          <div class="corner"></div>
          {#each Array(boardSize) as _, idx}
            <div class="label">{idx + 1}</div>
          {/each}
        </div>
        <div class="rows">
          {#each Array(boardSize) as _, row}
            <div class="row">
              <div class="label left">{letters[row]}</div>
              {#each Array(boardSize) as _, col}
                {#if true}
                  <div
                    class="cell enemy-cell"
                    on:click={() => handleEnemyCellClick(row, col)}
                  >
                    {#if shotStatusOnEnemy(row, col)}
                      <span class:hit={shotStatusOnEnemy(row, col)?.hit} class:miss={!shotStatusOnEnemy(row, col)?.hit}></span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="board-panel own">
      <h3>Your Fleet</h3>
      <div class="board">
        <div class="labels top">
          <div class="corner"></div>
          {#each Array(boardSize) as _, idx}
            <div class="label">{idx + 1}</div>
          {/each}
        </div>
        <div class="rows">
          {#each Array(boardSize) as _, row}
            <div class="row">
              <div class="label left">{letters[row]}</div>
              {#each Array(boardSize) as _, col}
                <div
                  class="cell own-cell"
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
            </div>
          {/each}
        </div>
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
    gap: 1rem;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .status {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
  }
  .player-tag.you {
    background: #e0f2fe;
    color: #075985;
  }
  .player-tag.opp {
    background: #fee2e2;
    color: #991b1b;
  }
  .boards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .board-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .board {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 0.25rem;
  }
  .labels.top {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(24px, 1fr));
    grid-template-columns: repeat(11, 1fr);
    gap: 2px;
    align-items: center;
  }
  .labels .corner {
    width: 24px;
  }
  .labels .label {
    text-align: center;
    font-size: 0.8rem;
    color: #475569;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(11, 1fr);
    gap: 2px;
    align-items: center;
  }
  .row .label.left {
    text-align: center;
    font-size: 0.8rem;
    color: #475569;
  }
  .cell {
    width: 28px;
    height: 28px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    position: relative;
    cursor: pointer;
  }
  .cell:hover {
    background: #e2e8f0;
  }
  .enemy-cell {
    background: #fff7ed;
  }
  .ship {
    position: absolute;
    inset: 3px;
    border: 2px solid rgba(59,130,246,0.8);
    background: rgba(59,130,246,0.2);
    border-radius: 4px;
  }
  .ship.red { border-color: rgba(239,68,68,0.8); background: rgba(239,68,68,0.2); }
  .ship.blue { border-color: rgba(59,130,246,0.8); background: rgba(59,130,246,0.2); }
  .hit-marker {
    position: absolute;
    inset: 8px;
    border-radius: 999px;
    background: #dc2626;
  }
  .enemy-cell span {
    position: absolute;
    inset: 8px;
    border-radius: 999px;
    background: #94a3b8;
  }
  .enemy-cell span.hit { background: #dc2626; }
  .enemy-cell span.miss { background: #94a3b8; opacity: 0.6; }
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
    background: #f8fafc;
  }
  .ship-list button.selected {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    background: #e0f2fe;
  }
  .ship-list button:disabled {
    opacity: 0.4;
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
    .labels.top, .row {
      grid-template-columns: repeat(11, minmax(20px, 1fr));
    }
    .cell {
      width: 24px;
      height: 24px;
    }
  }
</style>
