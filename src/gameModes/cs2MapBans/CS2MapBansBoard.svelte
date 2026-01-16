<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
  import type { CS2MapBansGameState } from '../../types/cs2MapBans';
  import type { Player, PlayerInfo } from '../../types/core';
  import { canMakeMove } from './CS2MapBansLogic';

  export let gameState: CS2MapBansGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;

  const dispatch = createEventDispatcher();

  let selectedMaps: string[] = [];
  let lastRound = -1;

  $: requiredBans = gameState.bansPerRound[gameState.currentRound] ?? 0;
  $: bannedSet = new Set(gameState.bannedMaps.map((ban) => ban.name));
  $: availableMaps = gameState.maps.filter((map) => !bannedSet.has(map));
  $: isMyTurn = gameState.currentTurn === myColor && !gameState.winner && !gameState.winningMap;
  $: opponentName = opponentInfo?.name || 'Opponent';
  $: currentBannerName = gameState.currentTurn === myColor ? (myPlayerInfo?.name || 'You') : opponentName;
  $: missingBans = Math.max(0, requiredBans - selectedMaps.length);

  $: if (gameState.currentRound !== lastRound) {
    selectedMaps = [];
    lastRound = gameState.currentRound;
  }

  $: selectedMaps = selectedMaps.filter((map) => !bannedSet.has(map));

  $: canSubmit = canMakeMove(
    gameState,
    { type: 'submitBans', bans: selectedMaps, player: myColor },
    myColor
  );

  $: {
    debugLog('CS2MapBansBoard reactive update:', {
      currentRound: gameState.currentRound,
      requiredBans,
      selectedMaps,
      availableMaps,
      bannedMaps: gameState.bannedMaps
    });
  }

  function toggleMap(mapName: string) {
    if (!isMyTurn || bannedSet.has(mapName)) return;

    if (selectedMaps.includes(mapName)) {
      selectedMaps = selectedMaps.filter((map) => map !== mapName);
      return;
    }

    if (selectedMaps.length >= requiredBans) return;

    selectedMaps = [...selectedMaps, mapName];
  }

  function handleSubmit() {
    if (!isMyTurn || !canSubmit) return;
    dispatch('move', { bans: [...selectedMaps] });
    selectedMaps = [];
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }
</script>

<div class="game-container">
  {#if connected && gameState.gameStarted && !gameState.winner && !gameState.winningMap && gameState.turnTimeLimit > 0}
    <div class="turn-timer" class:urgent={gameState.timeRemaining <= 5}>
      <div class="timer-label">Time remaining</div>
      <div class="timer-display">{formatTime(gameState.timeRemaining)}</div>
      <div class="timer-bar">
        <div
          class="timer-progress"
          style="width: {(gameState.timeRemaining / gameState.turnTimeLimit) * 100}%"
        ></div>
      </div>
    </div>
  {/if}

  <div class="players-info">
    <div class="player-display" class:active-turn={gameState.currentTurn === myColor}>
      <span class="color-indicator {myColor}"></span>
      <span class="player-name">{myPlayerInfo?.name || 'You'}</span>
      {#if gameState.currentTurn === myColor && !gameState.winningMap}
        <span class="turn-indicator">Your ban</span>
      {/if}
    </div>
    <div class="vs-divider">VS</div>
    <div class="player-display" class:active-turn={gameState.currentTurn !== myColor}>
      <span class="color-indicator {myColor === 'red' ? 'blue' : 'red'}"></span>
      <span class="player-name">{opponentName}</span>
      {#if gameState.currentTurn !== myColor && !gameState.winningMap}
        <span class="turn-indicator">Their ban</span>
      {/if}
    </div>
  </div>

  <div class="round-info">
    <div class="round-title">Round {gameState.currentRound + 1} of {gameState.bansPerRound.length}</div>
    <div class="round-subtitle">
      {#if gameState.winningMap}
        Winner decided
      {:else}
        {currentBannerName} must ban {requiredBans} map{requiredBans === 1 ? '' : 's'}
      {/if}
    </div>
  </div>

  <div class="banned-summary">
    <div class="summary-title">Banned maps</div>
    {#if gameState.bannedMaps.length === 0}
      <div class="summary-empty">No bans yet.</div>
    {:else}
      <div class="summary-grid">
        {#each gameState.bannedMaps as ban}
          <div class="summary-item {ban.bannedBy}">
            <div class="summary-name">{ban.name}</div>
            <div class="summary-meta">
              Round {ban.round} - {ban.bannedBy === myColor ? 'You' : opponentName}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if !gameState.winningMap}
    <div class="selection-status">
      <div class="selection-count">
        Selected: {selectedMaps.length} / {requiredBans}
      </div>
      {#if missingBans > 0}
        <div class="selection-hint">Missing {missingBans} - will be random on submit.</div>
      {/if}
    </div>

    <div class="map-grid">
      {#each availableMaps as mapName}
        <button
          class="map-card {selectedMaps.includes(mapName) ? 'selected' : ''}"
          disabled={!isMyTurn}
          on:click={() => toggleMap(mapName)}
        >
          <div class="map-name">{mapName}</div>
          {#if selectedMaps.includes(mapName)}
            <div class="map-selected">Selected</div>
          {/if}
        </button>
      {/each}
    </div>

    <button class="submit-btn" on:click={handleSubmit} disabled={!isMyTurn || !canSubmit}>
      Confirm bans
    </button>
  {/if}

  {#if gameState.winningMap}
    <div class="game-over-overlay">
      <div class="game-over-popup">
        <div class="win-content">
          <h2>Winning map</h2>
          <div class="winning-map">{gameState.winningMap}</div>
        </div>
        <button on:click={() => dispatch('reset')} class="reset-btn">
          New ban
        </button>
        <button on:click={() => dispatch('mainMenu')} class="main-menu-btn">
          Main Menu
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
  }

  .turn-timer {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .turn-timer.urgent {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    animation: pulse-urgent 1s infinite;
  }

  .timer-label {
    font-size: 0.9rem;
    color: #666;
  }

  .timer-display {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
    margin: 0.25rem 0 0.5rem;
  }

  .timer-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .timer-progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    transition: width 0.1s linear;
  }

  .players-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 12px;
    flex-wrap: wrap;
  }

  .player-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .player-display.active-turn {
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .color-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-block;
  }

  .color-indicator.red {
    background-color: #ef4444;
  }

  .color-indicator.blue {
    background-color: #3b82f6;
  }

  .player-name {
    font-size: 0.9rem;
    color: #333;
  }

  .turn-indicator {
    font-size: 0.8rem;
    color: #3b82f6;
    font-weight: bold;
    animation: pulse-indicator 2s infinite;
  }

  .vs-divider {
    font-weight: bold;
    color: #666;
    font-size: 0.9rem;
  }

  .round-info {
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }

  .round-title {
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .round-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .banned-summary {
    width: 100%;
    max-width: 700px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    text-align: center;
  }

  .summary-title {
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.75rem;
  }

  .summary-empty {
    color: #9ca3af;
    font-style: italic;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .summary-item {
    border-radius: 10px;
    padding: 0.75rem;
    background: #f3f4f6;
    border: 2px solid #e5e7eb;
  }

  .summary-item.red {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }

  .summary-item.blue {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
  }

  .summary-name {
    font-weight: bold;
    color: #111827;
  }

  .summary-meta {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .selection-status {
    text-align: center;
    color: #374151;
  }

  .selection-count {
    font-weight: 500;
  }

  .selection-hint {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .map-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .map-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    min-height: 90px;
  }

  .map-card:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #3b82f6;
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.15);
  }

  .map-card.selected {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
  }

  .map-card:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .map-name {
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .map-selected {
    font-size: 0.8rem;
    color: #10b981;
    font-weight: 600;
  }

  .submit-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 0.9rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }

  .game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .game-over-popup {
    background: white;
    border-radius: 20px;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 420px;
    width: 90%;
    animation: popup-appear 0.3s ease-out;
  }

  .win-content h2 {
    color: #111827;
    font-size: 1.8rem;
    margin: 0 0 0.75rem 0;
  }

  .winning-map {
    font-size: 2.5rem;
    font-weight: bold;
    color: #10b981;
    letter-spacing: 1px;
    margin-bottom: 1.5rem;
  }

  .reset-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.9rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .main-menu-btn {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    color: white;
    border: none;
    padding: 0.9rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    margin-top: 1rem;
  }

  .main-menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
  }

  @keyframes pulse-indicator {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse-urgent {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }
  }

  @keyframes popup-appear {
    0% {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (max-width: 600px) {
    .game-container {
      padding: 1rem;
    }

    .map-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .winning-map {
      font-size: 2rem;
    }
  }
</style>
