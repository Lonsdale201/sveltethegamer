<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CountryWarGameState, CountryWarAction, Territory } from '../../types/countryWar';
  import type { PlayerInfo, GameSettings } from '../../types/core';
  import type { Player } from '../../types/core';
  import { canMakeMove } from './CountryWarLogic';

  export let gameState: CountryWarGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  let selectedTerritory: number | null = null;
  let selectedAction: CountryWarAction | null = null;

  function handleTerritoryClick(territory: Territory) {
    console.log('Territory clicked:', territory);
    
    if (!connected || !gameState.gameStarted || gameState.winner || gameState.currentTurn !== myColor) {
      return;
    }

    // If no territory selected, select this one (if owned by player or can be targeted)
    if (selectedTerritory === null) {
      if (territory.owner === myColor && territory.hasBase) {
        selectedTerritory = territory.id;
        selectedAction = null;
      }
      return;
    }

    // If clicking the same territory, deselect
    if (selectedTerritory === territory.id) {
      selectedTerritory = null;
      selectedAction = null;
      return;
    }

    // If we have a selected territory and action, try to execute the move
    if (selectedTerritory !== null && selectedAction) {
      const moveData = {
        action: selectedAction,
        fromTerritoryId: selectedTerritory,
        toTerritoryId: territory.id,
        player: myColor
      };

      if (canMakeMove(gameState, moveData, myColor)) {
        dispatch('move', moveData);
        selectedTerritory = null;
        selectedAction = null;
      }
    } else {
      // Select new territory if owned by player and has base
      if (territory.owner === myColor && territory.hasBase) {
        selectedTerritory = territory.id;
        selectedAction = null;
      }
    }
  }

  function handleActionSelect(action: CountryWarAction) {
    if (selectedTerritory === null) return;

    selectedAction = action;

    // For build action, execute immediately
    if (action === 'build') {
      const moveData = {
        action: 'build',
        fromTerritoryId: selectedTerritory,
        player: myColor
      };

      if (canMakeMove(gameState, moveData, myColor)) {
        dispatch('move', moveData);
        selectedTerritory = null;
        selectedAction = null;
      }
    }
  }

  function getTerritoryClass(territory: Territory): string {
    let classes = 'territory';
    
    if (territory.owner === 'red') classes += ' red';
    else if (territory.owner === 'blue') classes += ' blue';
    else classes += ' neutral';
    
    if (selectedTerritory === territory.id) classes += ' selected';
    
    // Can select if owned by player and has base
    if (territory.owner === myColor && territory.hasBase) classes += ' clickable';
    
    // Show as target if we have selected territory and action
    if (selectedTerritory !== null && selectedAction && territory.id !== selectedTerritory) {
      const selectedTerr = gameState.territories.find(t => t.id === selectedTerritory);
      if (selectedTerr && selectedTerr.connections.includes(territory.id)) {
        classes += ' target';
      }
    }
    
    return classes;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }

  function getActionButtonClass(action: CountryWarAction): string {
    let classes = 'action-btn';
    if (selectedAction === action) classes += ' selected';
    
    if (selectedTerritory !== null) {
      const territory = gameState.territories.find(t => t.id === selectedTerritory);
      if (territory) {
        const moveData = { action, fromTerritoryId: selectedTerritory, player: myColor };
        if (!canMakeMove(gameState, moveData, myColor)) {
          classes += ' disabled';
        }
      }
    } else {
      classes += ' disabled';
    }
    
    return classes;
  }

  function getAvailableActions(): Territory[] {
    if (selectedTerritory === null || selectedAction === null) return [];
    
    const selectedTerr = gameState.territories.find(t => t.id === selectedTerritory);
    if (!selectedTerr) return [];
    
    return gameState.territories.filter(territory => {
      if (territory.id === selectedTerritory) return false;
      if (!selectedTerr.connections.includes(territory.id)) return false;
      
      const moveData = {
        action: selectedAction,
        fromTerritoryId: selectedTerritory,
        toTerritoryId: territory.id,
        player: myColor
      };
      
      return canMakeMove(gameState, moveData, myColor);
    });
  }

  $: myTerritories = gameState.territories.filter(t => t.owner === myColor);
  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: opponentTerritories = gameState.territories.filter(t => t.owner === opponentColor);
  $: myBases = gameState.territories.filter(t => t.owner === myColor && t.hasBase);
  $: availableTargets = getAvailableActions();
</script>

<!-- Fixed Timer at Top -->
{#if connected && gameState.gameStarted && !gameState.winner && gameState.turnTimeLimit > 0}
  <div class="fixed-timer" class:urgent={gameState.timeRemaining <= 5}>
    <div class="timer-content">
      <span class="timer-icon">⏱️</span>
      <span class="timer-display">{formatTime(gameState.timeRemaining)}</span>
      <div class="timer-bar">
        <div 
          class="timer-progress" 
          style="width: {(gameState.timeRemaining / gameState.turnTimeLimit) * 100}%"
        ></div>
      </div>
    </div>
  </div>
{/if}

<div class="game-container">
  <div class="game-status">
    {#if connected && gameState.gameStarted}
      <div class="players-info">
        <div class="player-display" class:active-turn={gameState.currentTurn === myColor}>
          <span class="color-indicator {myColor}"></span>
          <span class="player-name">{myPlayerInfo?.name || 'You'}</span>
          <span class="territory-count">{myTerritories.length}/8</span>
          <span class="base-count">🏰 {myBases.length}</span>
          {#if gameState.currentTurn === myColor}
            <span class="turn-indicator">← Your turn</span>
          {/if}
        </div>
        <div class="vs-divider">VS</div>
        <div class="player-display" class:active-turn={gameState.currentTurn !== myColor}>
          <span class="color-indicator {opponentColor}"></span>
          <span class="player-name">{opponentInfo?.name || 'Opponent'}</span>
          <span class="territory-count">{opponentTerritories.length}/8</span>
          <span class="base-count">🏰 {gameState.territories.filter(t => t.owner === opponentColor && t.hasBase).length}</span>
          {#if gameState.currentTurn !== myColor}
            <span class="turn-indicator">← Their turn</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="battlefield">
    <div class="map-container">
      <svg class="map" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <!-- Connection lines -->
        {#each gameState.territories as territory}
          {#each territory.connections as connectionId}
            {#if territory.id < connectionId}
              {@const connectedTerritory = gameState.territories.find(t => t.id === connectionId)}
              {#if connectedTerritory}
                {@const isPlayerConnection = territory.owner === myColor && connectedTerritory.owner === myColor && territory.hasBase && connectedTerritory.hasBase}
                <line
                  x1={territory.position.x * 80 + 50}
                  y1={territory.position.y * 120 + 80}
                  x2={connectedTerritory.position.x * 80 + 50}
                  y2={connectedTerritory.position.y * 120 + 80}
                  class="connection-line"
                  class:player-connection={isPlayerConnection}
                  class:player-red={isPlayerConnection && myColor === 'red'}
                  class:player-blue={isPlayerConnection && myColor === 'blue'}
                />
              {/if}
            {/if}
          {/each}
        {/each}

        <!-- Territories -->
        {#each gameState.territories as territory}
          <g class="territory-group">
            <!-- Territory circle -->
            <circle
              cx={territory.position.x * 80 + 50}
              cy={territory.position.y * 120 + 80}
              r="30"
              class={getTerritoryClass(territory)}
              on:click={() => handleTerritoryClick(territory)}
            />
            
            <!-- Base indicator -->
            {#if territory.hasBase}
              <text
                x={territory.position.x * 80 + 50}
                y={territory.position.y * 120 + 65}
                class="base-icon"
                text-anchor="middle"
              >
                🏰
              </text>
            {/if}
            
            <!-- Territory value (only show if has value) -->
            {#if territory.baseValue > 0}
              <text
                x={territory.position.x * 80 + 50}
                y={territory.position.y * 120 + 90}
                class="territory-value"
                text-anchor="middle"
              >
                {territory.baseValue}
              </text>
            {/if}
            
            <!-- Territory ID -->
            <text
              x={territory.position.x * 80 + 50}
              y={territory.position.y * 120 + 105}
              class="territory-id"
              text-anchor="middle"
            >
              {territory.id}
            </text>
          </g>
        {/each}
      </svg>
    </div>
  </div>

  {#if connected && gameState.gameStarted && !gameState.winner && gameState.currentTurn === myColor}
    <div class="actions-container">
      <h3>
        {#if selectedTerritory !== null}
          Actions for Territory {selectedTerritory}
        {:else}
          Select a base to take action
        {/if}
      </h3>
      
      {#if selectedTerritory === null}
        <p class="instruction">Click on one of your bases (🏰) to select it</p>
      {:else}
        <div class="action-buttons">
          <button 
            class={getActionButtonClass('build')}
            on:click={() => handleActionSelect('build')}
          >
            🏗️ Build Base
            <span class="action-desc">Cost: 10 army units</span>
            <span class="requirement">Need: 10+ units</span>
          </button>
          
          <button 
            class={getActionButtonClass('move')}
            on:click={() => handleActionSelect('move')}
          >
            ⚔️ Move Army
            <span class="action-desc">Attack or reinforce</span>
            <span class="requirement">Leave 1 unit behind</span>
          </button>
          
          <button 
            class={getActionButtonClass('merge')}
            on:click={() => handleActionSelect('merge')}
          >
            🔄 Merge Bases
            <span class="action-desc">Combine with ally</span>
            <span class="requirement">Adjacent bases only</span>
          </button>
        </div>
        
        {#if selectedAction}
          <div class="target-info">
            <p class="instruction">
              {#if selectedAction === 'move'}
                Click a connected territory to move your army
              {:else if selectedAction === 'merge'}
                Click a connected allied base to merge
              {:else if selectedAction === 'build'}
                Building base on current territory...
              {/if}
            </p>
            
            {#if availableTargets.length > 0}
              <div class="available-targets">
                <span>Available targets: </span>
                {#each availableTargets as target}
                  <span class="target-chip">#{target.id}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  {#if gameState.winner}
    <div class="game-over-overlay">
      <div class="game-over-popup" on:click|stopPropagation>
        {#if gameState.winner === myColor}
          <div class="win-content">
            <div class="win-emoji">👑</div>
            <h2>Victory!</h2>
            <p>You conquered the battlefield!</p>
          </div>
        {:else}
          <div class="lose-content">
            <div class="lose-emoji">⚔️</div>
            <h2>Defeat</h2>
            <p>Your empire has fallen...</p>
          </div>
        {/if}
        <button on:click={() => dispatch('reset')} class="reset-btn">
          New Campaign
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .fixed-timer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 2px solid #e5e7eb;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
  }

  .fixed-timer.urgent {
    background: rgba(239, 68, 68, 0.95);
    border-bottom-color: #dc2626;
    animation: pulse-urgent 1s infinite;
  }

  .timer-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .timer-icon {
    font-size: 1.2rem;
  }

  .timer-display {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
    min-width: 60px;
    text-align: center;
  }

  .urgent .timer-display {
    color: white;
  }

  .timer-bar {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    max-width: 150px;
  }

  .timer-progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    transition: width 0.1s linear;
    border-radius: 3px;
  }

  .urgent .timer-progress {
    background: linear-gradient(90deg, #ffffff, #f3f4f6);
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding-top: 5rem;
  }

  .game-status {
    text-align: center;
    width: 100%;
  }

  .players-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    backdrop-filter: blur(5px);
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
    position: relative;
  }

  .player-display.active-turn {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    transform: scale(1.05);
  }

  .vs-divider {
    font-weight: bold;
    color: #666;
    font-size: 0.9rem;
  }

  .player-name {
    font-size: 0.9rem;
    color: #333;
  }

  .territory-count, .base-count {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .turn-indicator {
    font-size: 0.8rem;
    color: #3b82f6;
    font-weight: bold;
    animation: pulse-indicator 2s infinite;
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

  .battlefield {
    width: 100%;
    max-width: 500px;
  }

  .map-container {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .map {
    width: 100%;
    height: auto;
  }

  .connection-line {
    stroke: #d1d5db;
    stroke-width: 2;
    opacity: 0.6;
  }

  .connection-line.player-connection {
    stroke-width: 3;
    opacity: 0.8;
    stroke-dasharray: 5,5;
    animation: dash 2s linear infinite;
  }

  .connection-line.player-red {
    stroke: #ef4444;
  }

  .connection-line.player-blue {
    stroke: #3b82f6;
  }

  .territory {
    cursor: pointer;
    transition: all 0.3s ease;
    stroke-width: 3;
  }

  .territory.neutral {
    fill: #f9fafb;
    stroke: #9ca3af;
  }

  .territory.red {
    fill: #fecaca;
    stroke: #ef4444;
  }

  .territory.blue {
    fill: #bfdbfe;
    stroke: #3b82f6;
  }

  .territory.selected {
    stroke-width: 5;
    filter: drop-shadow(0 0 8px currentColor);
    animation: pulse-territory 1.5s ease-in-out infinite;
  }

  .territory.target {
    stroke: #10b981;
    stroke-width: 4;
    stroke-dasharray: 5,5;
    animation: dash 1s linear infinite;
  }

  .territory.clickable:hover {
    transform: scale(1.1);
    filter: brightness(1.1);
  }

  .base-icon {
    font-size: 16px;
    pointer-events: none;
    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
  }

  .territory-value {
    font-size: 14px;
    font-weight: bold;
    fill: #1f2937;
    pointer-events: none;
  }

  .territory-id {
    font-size: 10px;
    fill: #6b7280;
    pointer-events: none;
  }

  .actions-container {
    width: 100%;
    max-width: 600px;
    text-align: center;
  }

  .actions-container h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.1rem;
  }

  .instruction {
    color: #6b7280;
    font-style: italic;
    margin: 1rem 0;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .action-btn {
    padding: 1rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 140px;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    color: #374151;
    border: 2px solid #d1d5db;
    position: relative;
  }

  .action-btn:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .action-btn.selected {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: #1d4ed8;
  }

  .action-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .action-desc {
    font-size: 0.8rem;
    opacity: 0.9;
  }

  .requirement {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  .target-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid #3b82f6;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
  }

  .available-targets {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .target-chip {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
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
    max-width: 400px;
    width: 90%;
    animation: popup-appear 0.3s ease-out;
  }

  .win-content, .lose-content {
    margin-bottom: 2rem;
  }

  .win-emoji, .lose-emoji {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce-emoji 0.6s ease-out;
  }

  .win-content h2 {
    color: #10b981;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(16, 185, 129, 0.3);
  }

  .lose-content h2 {
    color: #ef4444;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(239, 68, 68, 0.3);
  }

  .win-content p, .lose-content p {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
  }

  .reset-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  @keyframes pulse-indicator {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse-urgent {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.01);
    }
  }

  @keyframes pulse-territory {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -10;
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

  @keyframes bounce-emoji {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-20px);
    }
    60% {
      transform: translateY(-10px);
    }
  }

  @media (max-width: 768px) {
    .game-container {
      padding: 0.5rem;
      gap: 1rem;
      padding-top: 4.5rem;
    }
    
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .action-btn {
      min-width: 200px;
    }
    
    .players-info {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    
    .timer-content {
      gap: 0.5rem;
    }
    
    .timer-display {
      font-size: 1.2rem;
    }
    
    .fixed-timer {
      padding: 0.5rem;
    }
  }
</style>