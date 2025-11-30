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
  let placementStart: Coord | null = null;
  let previewCoords: Coord[] = [];
  let previewInvalid = false;
  let statusText = 'Válassz hajót, kattints a pályán a kezdő cellára, majd a végpontra.';

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: boardSize = gameState.boardSize;
  $: shipCounts = (() => {
    const counts: Record<number, { allowed: number; placed: number; remaining: number }> = {};
    for (const sz of gameState.availableShips) {
      counts[sz] = counts[sz] || { allowed: 0, placed: 0, remaining: 0 };
      counts[sz].allowed += 1;
    }
    for (const p of gameState.shipsPlaced[myColor]) {
      counts[p.size] = counts[p.size] || { allowed: 0, placed: 0, remaining: 0 };
      counts[p.size].placed += 1;
    }
    for (const key of Object.keys(counts)) {
      const c = counts[Number(key)];
      c.remaining = Math.max(0, c.allowed - c.placed);
    }
    return counts;
  })();
  $: phase = gameState.phase;

  function selectShip(size: number) {
    selectedShipSize = size;
    placementStart = null;
    previewCoords = [];
    previewInvalid = false;
    statusText = `Kiválasztott hajó: ${size} hosszú. Kattints a pályán a hajó elejére.`;
  }

  function hasShip(x: number, y: number, player: Player) {
    return gameState.boards[player]?.grid?.[x]?.[y]?.hasShip;
  }

  function getCellsForPlacement(start: Coord, end: Coord, size: number): Coord[] | null {
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
      const cx = start.x + dy * i;
      const cy = start.y + dx * i;
      if (cx < 0 || cx >= boardSize || cy < 0 || cy >= boardSize) return null;
      cells.push({ x: cx, y: cy });
    }
    return cells;
  }

  function isPlacementValid(cells: Coord[] | null): boolean {
    if (!cells) return false;
    for (const c of cells) {
      if (hasShip(c.x, c.y, myColor)) return false;
    }
    return true;
  }

  function handleOwnCellClick(x: number, y: number) {
    if (phase !== 'placement') return;
    if (!selectedShipSize) {
      statusText = 'Először válassz egy hajót alul.';
      return;
    }

    if (!placementStart) {
      placementStart = { x, y };
      previewCoords = [];
      previewInvalid = false;
      statusText = 'Mozgasd az egeret a hajó irányába, majd kattints a végpontra.';
      return;
    }

    const end: Coord = { x, y };
    const cells = getCellsForPlacement(placementStart, end, selectedShipSize);
    const valid = isPlacementValid(cells);
    if (!valid || !cells) {
      statusText = 'Érvénytelen pozíció: ne lógjon le és ne ütközzön más hajóval.';
      return;
    }

    const move: TorpedoMoveData = { type: 'placeShip', start: placementStart, end, size: selectedShipSize, player: myColor };
    dispatch('move', move);
    placementStart = null;
    previewCoords = [];
    previewInvalid = false;
    selectedShipSize = null;
    statusText = 'Hajó lerakva. Válassz egy újabbat.';
  }

  function handleOwnCellHover(x: number, y: number) {
    if (phase !== 'placement' || !selectedShipSize || !placementStart) return;
    const end: Coord = { x, y };
    const cells = getCellsForPlacement(placementStart, end, selectedShipSize);
    previewCoords = cells || [];
    previewInvalid = !isPlacementValid(cells);
  }

  function handleOwnLeave() {
    if (!placementStart) {
      previewCoords = [];
      previewInvalid = false;
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

  function isPreviewCell(x: number, y: number) {
    return previewCoords.some((c) => c.x === x && c.y === y);
  }
</script>

<div class="torpedo-wrapper">
  <div class="header">
    <div class="status">
      <div class="phase">Fázis: {phase === 'placement' ? 'Előkészítés' : 'Csata'}</div>
      {#if phase === 'battle'}
        <div class="turn">Kör: {gameState.currentTurn === myColor ? 'Te lősz' : 'Ellenfél köre'}</div>
      {:else}
        <div class="turn">Hajók: {gameState.shipsPlaced[myColor].length}/{gameState.availableShips.length}</div>
      {/if}
    </div>
    <div class="players">
      <div class="player-tag you">{myPlayerInfo?.name || 'You'} ({myColor})</div>
      <div class="player-tag opp">{opponentInfo?.name || 'Opponent'} ({opponentColor})</div>
    </div>
  </div>

  <div class="boards">
    <div class="board-panel enemy">
      <div class="board-title">Ellenfél</div>
      <div class="board" style={`--cols:${boardSize};`}>
        <div class="corner"></div>
        {#each Array(boardSize) as _, idx}
          <div class="label top">{letters[idx]}</div>
        {/each}
        {#each Array(boardSize) as _, row}
          <div class="label left">{row + 1}</div>
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
      <div class="board-title">Saját pálya</div>
      <div class="board" style={`--cols:${boardSize};`}>
        <div class="corner"></div>
        {#each Array(boardSize) as _, idx}
          <div class="label top">{letters[idx]}</div>
        {/each}
        {#each Array(boardSize) as _, row}
          <div class="label left">{row + 1}</div>
          {#each Array(boardSize) as _, col}
            <div
              class="cell own-cell {col === boardSize - 1 ? 'last-col' : ''} {row === boardSize - 1 ? 'last-row' : ''} {isPreviewCell(row,col) ? (previewInvalid ? 'preview-invalid' : 'preview') : ''} {placementStart && placementStart.x === row && placementStart.y === col ? 'start' : ''}"
              on:click={() => handleOwnCellClick(row, col)}
              on:mousemove={() => handleOwnCellHover(row, col)}
              on:mouseleave={handleOwnLeave}
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
        <div class="shipyard">
          <div class="shipyard-title">Hajók (kattints, majd rakd le a pályára)</div>
          <div class="ship-list">
            {#each Object.keys(shipCounts).map(Number).sort((a, b) => a - b) as size}
              {#if shipCounts[size]?.remaining > 0}
                <button
                  class="ship-btn {selectedShipSize === size ? 'selected' : ''}"
                  on:click={() => selectShip(size)}
                >
                  <span>{size} hosszú (marad: {shipCounts[size].remaining})</span>
                  <span class="ship-cells">
                    {#each Array(size) as _, i}
                      <span></span>
                    {/each}
                  </span>
                </button>
              {:else}
                <button class="ship-btn used" disabled>
                  <span>{size} hosszú</span>
                  <span class="ship-cells">
                    {#each Array(size) as _, i}
                      <span></span>
                    {/each}
                  </span>
                </button>
              {/if}
            {/each}
          </div>
          <div class="status-text">{statusText}</div>
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
  .preview {
    background: rgba(37,99,235,0.15);
    box-shadow: inset 0 0 0 2px rgba(37,99,235,0.35);
  }
  .preview-invalid {
    background: rgba(185,28,28,0.15);
    box-shadow: inset 0 0 0 2px rgba(185,28,28,0.35);
  }
  .start {
    outline: 2px dashed #f59e0b;
    outline-offset: -4px;
  }
  .cell.last-col {
    border-right: 1px solid #d1d5db;
  }
  .cell.last-row {
    border-bottom: 1px solid #d1d5db;
  }
  .ship {
    position: absolute;
    inset: 3px;
    border: 2px solid #0f766e;
    background: #14b8a6;
    border-radius: 4px;
  }
  .ship.red { border-color: #dc2626; background: #f87171; }
  .ship.blue { border-color: #2563eb; background: #93c5fd; }
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
  .shipyard {
    margin-top: 1.25rem;
    padding: 0.75rem 1rem 1rem;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e5e7eb;
  }
  .shipyard-title {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #475569;
    margin-bottom: 0.6rem;
  }
  .ship-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ship-btn {
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: background 0.12s ease, transform 0.08s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }
  .ship-btn:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  }
  .ship-btn.selected {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    background: #e0f2fe;
  }
  .ship-btn.used {
    opacity: 0.4;
    cursor: default;
    box-shadow: none;
    border-style: dashed;
    background: #f1f5f9;
  }
  .ship-cells {
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: 0.8rem;
    height: 0.8rem;
  }
  .ship-cells span {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 0.15rem;
    background: #0f766e;
    border: 1px solid #14b8a6;
  }
  .status-text {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #475569;
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
