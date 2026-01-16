<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
  import type { CS2MapBansGameState, Side } from '../../types/cs2MapBans';
  import type { Player, PlayerInfo } from '../../types/core';
  import { canMakeMove } from './CS2MapBansLogic';
  import ctIcon from '../../assets/ct-icon.webp';
  import tIcon from '../../assets/t-icon.webp';
  import d2Image from '../../assets/d2.webp';
  import ancientImage from '../../assets/ancient.webp';
  import infernoImage from '../../assets/inferno.webp';
  import mirageImage from '../../assets/mirage.webp';
  import nukeImage from '../../assets/nuke.webp';
  import overpassImage from '../../assets/overpass.webp';
  import trainImage from '../../assets/train.webp';

  export let gameState: CS2MapBansGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;

  const dispatch = createEventDispatcher();

  let selectedMaps: string[] = [];
  let lastRound = -1;
  let selectedSide: Side | null = null;

  $: isBanPhase = gameState.phase === 'bans';
  $: isSideSelection = gameState.phase === 'side-selection';
  $: isComplete = gameState.phase === 'complete';
  $: requiredBans = isBanPhase ? (gameState.bansPerRound[gameState.currentRound] ?? 0) : 0;
  $: bannedSet = new Set(gameState.bannedMaps.map((ban) => ban.name));
  $: availableMaps = gameState.maps.filter((map) => !bannedSet.has(map));
  $: isMyTurn = gameState.currentTurn === myColor && !isComplete;
  $: opponentName = opponentInfo?.name || 'Opponent';
  $: currentBannerName = gameState.currentTurn === myColor ? (myPlayerInfo?.name || 'You') : opponentName;
  $: missingBans = Math.max(0, requiredBans - selectedMaps.length);
  $: sideChooser = gameState.sideChoice.player;
  $: sideSelected = gameState.sideChoice.side;
  $: mySide = sideSelected && sideChooser
    ? (myColor === sideChooser ? sideSelected : (sideSelected === 'CT' ? 'T' : 'CT'))
    : null;
  $: displaySide = sideSelected ?? selectedSide;
  $: winningMapImage = gameState.winningMap ? getMapImage(gameState.winningMap) : '';

  $: if (gameState.currentRound !== lastRound) {
    selectedMaps = [];
    lastRound = gameState.currentRound;
  }

  $: if (!isBanPhase && selectedMaps.length > 0) {
    selectedMaps = [];
  }

  $: if (!isSideSelection) {
    selectedSide = sideSelected ?? null;
  }

  $: selectedMaps = selectedMaps.filter((map) => !bannedSet.has(map));

  $: canSubmit = isBanPhase
    ? canMakeMove(gameState, { type: 'submitBans', bans: selectedMaps, player: myColor }, myColor)
    : false;
  $: canChooseSide = isSideSelection
    ? canMakeMove(gameState, { type: 'chooseSide', side: 'CT', player: myColor }, myColor)
    : false;

  $: {
    debugLog('CS2MapBansBoard reactive update:', {
      currentRound: gameState.currentRound,
      requiredBans,
      selectedMaps,
      availableMaps,
      bannedMaps: gameState.bannedMaps,
      phase: gameState.phase,
      sideChoice: gameState.sideChoice
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
    dispatch('move', { type: 'submitBans', bans: [...selectedMaps] });
    selectedMaps = [];
  }

  function handleChooseSide(side: Side) {
    if (!isMyTurn || !canChooseSide) return;
    selectedSide = side;
    dispatch('move', { type: 'chooseSide', side });
  }

  function getMapImage(mapName: string): string {
    const mapImages: Record<string, string> = {
      Dust2: d2Image,
      Mirage: mirageImage,
      Inferno: infernoImage,
      Train: trainImage,
      Nuke: nukeImage,
      Ancient: ancientImage,
      Overpass: overpassImage
    };
    return mapImages[mapName] || '';
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
  {#if connected && gameState.gameStarted && !isComplete && gameState.turnTimeLimit > 0}
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
      {#if gameState.currentTurn === myColor && !isComplete}
        <span class="turn-indicator">{isSideSelection ? 'Choose side' : 'Your ban'}</span>
      {/if}
    </div>
    <div class="vs-divider">VS</div>
    <div class="player-display" class:active-turn={gameState.currentTurn !== myColor}>
      <span class="color-indicator {myColor === 'red' ? 'blue' : 'red'}"></span>
      <span class="player-name">{opponentName}</span>
      {#if gameState.currentTurn !== myColor && !isComplete}
        <span class="turn-indicator">{isSideSelection ? 'Their side' : 'Their ban'}</span>
      {/if}
    </div>
  </div>

  <div class="round-info">
    <div class="round-title">
      {#if isBanPhase}
        Round {gameState.currentRound + 1} of {gameState.bansPerRound.length}
      {:else if isSideSelection}
        Side selection
      {:else}
        Final result
      {/if}
    </div>
    <div class="round-subtitle">
      {#if isBanPhase}
        {currentBannerName} must ban {requiredBans} map{requiredBans === 1 ? '' : 's'}
      {:else if isSideSelection}
        {currentBannerName} chooses CT or T side
      {:else}
        Map and sides locked in
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

  {#if isBanPhase}
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
          <img class="map-image" src={getMapImage(mapName)} alt={`${mapName} map`} loading="lazy" />
          <div class="map-label">{mapName}</div>
          <div class="map-overlay">
            <span class="map-check">✓</span>
          </div>
        </button>
      {/each}
    </div>

    <button class="submit-btn" on:click={handleSubmit} disabled={!isMyTurn || !canSubmit}>
      Confirm bans
    </button>
  {/if}

  {#if isSideSelection}
    <div class="side-selection">
      <div class="side-title">Final map</div>
      <div class="side-map">{gameState.winningMap || '-'}</div>
      {#if isMyTurn}
        <div class="side-prompt">Choose your side</div>
        <div class="side-options">
          <button
            class="side-card {displaySide === 'CT' ? 'selected' : ''}"
            on:click={() => handleChooseSide('CT')}
          >
            <img class="side-image" src={ctIcon} alt="CT side icon" />
            <div class="side-label">CT</div>
            <div class="side-overlay">
              <span class="side-check">✓</span>
            </div>
          </button>
          <button
            class="side-card {displaySide === 'T' ? 'selected' : ''}"
            on:click={() => handleChooseSide('T')}
          >
            <img class="side-image" src={tIcon} alt="T side icon" />
            <div class="side-label">T</div>
            <div class="side-overlay">
              <span class="side-check">✓</span>
            </div>
          </button>
        </div>
      {:else}
        <div class="side-prompt">Waiting for {opponentName} to choose side...</div>
      {/if}
    </div>
  {/if}

  {#if isComplete}
    <div class="game-over-overlay">
      <div class="game-over-popup">
        <div class="win-content">
          <h2>Winning map</h2>
          <div class="result-map-card">
            <img
              class="result-map-image"
              src={winningMapImage}
              alt={gameState.winningMap ? `${gameState.winningMap} map` : 'Selected map'}
            />
            <div class="result-map-name">{gameState.winningMap || '-'}</div>
          </div>
          <div class="result-side">
            <div class="result-label">Your side</div>
            <div class="result-card">
              <img
                class="result-image"
                src={mySide === 'CT' ? ctIcon : tIcon}
                alt="Selected side icon"
              />
              <div class="result-side-text">{mySide || '-'}</div>
            </div>
          </div>
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
    padding: 0;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    min-height: 90px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .map-image {
    width: 100%;
    height: 110px;
    object-fit: cover;
    display: block;
  }

  .map-label {
    font-weight: bold;
    color: #1f2937;
    padding: 0.65rem 0;
    background: white;
  }

  .map-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .map-card.selected .map-overlay {
    opacity: 1;
  }

  .map-check {
    font-size: 2.5rem;
    color: #10b981;
    background: white;
    border-radius: 999px;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .side-selection {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .side-title {
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.85rem;
  }

  .side-map {
    font-size: 1.6rem;
    font-weight: bold;
    color: #2563eb;
    margin-bottom: 1rem;
  }

  .side-prompt {
    font-size: 0.95rem;
    color: #374151;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .side-options {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .side-card {
    flex: 1;
    padding: 0;
    border-radius: 14px;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .side-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .side-card.selected {
    border-color: #10b981;
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
  }

  .side-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    display: block;
  }

  .side-label {
    font-weight: bold;
    font-size: 1rem;
    color: #111827;
    padding: 0.75rem 0;
    width: 100%;
    text-align: center;
    background: white;
  }

  .side-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .side-card.selected .side-overlay {
    opacity: 1;
  }

  .side-check {
    font-size: 2.5rem;
    color: #10b981;
    background: white;
    border-radius: 999px;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .waiting-side {
    color: #6b7280;
    font-style: italic;
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

  .winning-side {
    font-size: 1.2rem;
    font-weight: bold;
    color: #1f2937;
  }

  .result-side {
    margin-top: 1rem;
    text-align: center;
  }

  .result-label {
    font-size: 0.9rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
  }

  .result-card {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #e5e7eb;
    background: white;
    min-width: 160px;
  }

  .result-map-card {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #e5e7eb;
    background: white;
    margin-bottom: 1rem;
  }

  .result-map-image {
    width: 220px;
    height: 120px;
    object-fit: cover;
    display: block;
  }

  .result-map-name {
    font-weight: bold;
    font-size: 1.2rem;
    color: #111827;
    padding: 0.6rem 0;
    width: 100%;
    text-align: center;
    background: #f9fafb;
  }
  .result-image {
    width: 160px;
    height: 100px;
    object-fit: cover;
    display: block;
  }

  .result-side-text {
    font-weight: bold;
    font-size: 1.1rem;
    color: #111827;
    padding: 0.5rem 0;
    width: 100%;
    text-align: center;
    background: #f9fafb;
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
