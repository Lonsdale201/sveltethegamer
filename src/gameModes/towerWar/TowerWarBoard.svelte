<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
  import type { TowerWarGameState, TowerWarAction, Player } from '../../types/towerWar';
  import type { PlayerInfo, GameSettings } from '../../types/core';
  import { canMakeAction } from './TowerWarLogic';

  export let gameState: TowerWarGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  function handleAction(action: TowerWarAction) {
    debugLog('TowerWar handleAction:', { action, myColor, canMake: canMakeAction(gameState, action, myColor) });
    
    if (canMakeAction(gameState, action, myColor)) {
      debugLog('TowerWar dispatching action:', action);
      dispatch('move', { action });
    } else {
      debugLog('TowerWar action blocked:', action);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }

  function getTowerIcon(height: number): string {
    if (height === 0) return '🏗️';
    if (height <= 3) return '🏠';
    if (height <= 6) return '🏢';
    if (height <= 9) return '🏗️';
    return '🏰';
  }

  function getTowerBlocks(height: number): string[] {
    const blocks = [];
    for (let i = 0; i < height; i++) {
      if (i < 3) blocks.push('🟫'); // Foundation blocks
      else if (i < 6) blocks.push('🟨'); // Mid-level blocks
      else if (i < 9) blocks.push('🟦'); // High-level blocks
      else blocks.push('🟪'); // Top-level blocks
    }
    return blocks.reverse(); // Show from top to bottom
  }

  $: myPlayerState = gameState.players[myColor];
  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: opponentPlayerState = gameState.players[opponentColor];
  $: maxAttacks = gameSettings.towerWarSettings?.maxAttacks ?? 10;
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
          {#if gameState.currentTurn === myColor}
            <span class="turn-indicator">← Your turn</span>
          {/if}
        </div>
        <div class="vs-divider">VS</div>
        <div class="player-display" class:active-turn={gameState.currentTurn !== myColor}>
          <span class="color-indicator {opponentColor}"></span>
          <span class="player-name">{opponentInfo?.name || 'Opponent'}</span>
          {#if gameState.currentTurn !== myColor}
            <span class="turn-indicator">← Their turn</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="towers-container">
    <!-- My Tower -->
    <div class="tower-section my-tower">
      <div class="tower-header">
        <h3>Your Tower</h3>
        <div class="tower-icon">{getTowerIcon(myPlayerState.tower)}</div>
      </div>
      <div class="tower-display">
        <div class="tower-height">Level {myPlayerState.tower}/10</div>
        <div class="tower-visual">
          {#each getTowerBlocks(myPlayerState.tower) as block, index}
            <div class="tower-block" style="animation-delay: {index * 0.1}s">{block}</div>
          {/each}
          {#if myPlayerState.tower === 0}
            <div class="empty-foundation">🏗️ Foundation</div>
          {/if}
        </div>
        {#if myPlayerState.defense}
          <div class="defense-indicator">🛡️ Protected</div>
        {/if}
      </div>
    </div>

    <!-- Opponent Tower -->
    <div class="tower-section opponent-tower">
      <div class="tower-header">
        <h3>Enemy Tower</h3>
        <div class="tower-icon">{getTowerIcon(opponentPlayerState.tower)}</div>
      </div>
      <div class="tower-display">
        <div class="tower-height">Level {opponentPlayerState.tower}/10</div>
        <div class="tower-visual">
          {#each getTowerBlocks(opponentPlayerState.tower) as block, index}
            <div class="tower-block" style="animation-delay: {index * 0.1}s">{block}</div>
          {/each}
          {#if opponentPlayerState.tower === 0}
            <div class="empty-foundation">🏗️ Foundation</div>
          {/if}
        </div>
        {#if opponentPlayerState.defense}
          <div class="defense-indicator">🛡️ Protected</div>
        {/if}
      </div>
    </div>
  </div>

  {#if connected && gameState.gameStarted && !gameState.winner}
    <div class="actions-container">
      <h3>Choose Your Action</h3>
      <div class="action-buttons">
        <button 
          class="action-btn build-btn"
          on:click={() => handleAction('build')}
          disabled={!canMakeAction(gameState, 'build', myColor)}
        >
          🏗️ Build
          <span class="action-desc">+1 level</span>
        </button>
        
        <button 
          class="action-btn attack-btn"
          on:click={() => handleAction('attack')}
          disabled={!canMakeAction(gameState, 'attack', myColor)}
        >
          <div class="action-header">
            💥 Attack
            <span class="attack-counter">{myPlayerState.attacksRemaining}/{maxAttacks}</span>
          </div>
          <span class="action-desc">-1 enemy level</span>
          {#if myPlayerState.tower < 3}
            <span class="requirement">Need 3+ levels</span>
          {:else if myPlayerState.attacksRemaining === 0}
            <span class="requirement">No attacks left</span>
          {/if}
        </button>
        
        <button 
          class="action-btn defend-btn"
          on:click={() => handleAction('defend')}
          disabled={!canMakeAction(gameState, 'defend', myColor)}
        >
          🛡️ Defend
          <span class="action-desc">Block next attack</span>
          {#if myPlayerState.defense}
            <span class="requirement">Already active</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}

  {#if gameState.winner}
    <div class="game-over-overlay">
      <div class="game-over-popup" on:click|stopPropagation>
        {#if gameState.winner === myColor}
          <div class="win-content">
            <div class="win-emoji">🏆</div>
            <h2>Victory!</h2>
            <p>Your tower stands tall!</p>
          </div>
        {:else}
          <div class="lose-content">
            <div class="lose-emoji">💥</div>
            <h2>Defeat</h2>
            <p>Your tower has fallen...</p>
          </div>
        {/if}
        <button on:click={() => dispatch('reset')} class="reset-btn">
          New Battle
        </button>
        <button on:click={() => dispatch('mainMenu')} class="main-menu-btn">
          Main Menu
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
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding-top: 5rem; /* Space for fixed timer */
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

  .towers-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 600px;
  }

  .tower-section {
    text-align: center;
  }

  .tower-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tower-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
  }

  .my-tower h3 {
    color: #10b981;
  }

  .opponent-tower h3 {
    color: #ef4444;
  }

  .tower-icon {
    font-size: 1.5rem;
  }

  .tower-display {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .tower-height {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
  }

  .tower-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 100px;
    justify-content: flex-end;
  }

  .tower-block {
    font-size: 1.2rem;
    animation: block-appear 0.3s ease-out;
    line-height: 1;
  }

  .empty-foundation {
    color: #9ca3af;
    font-size: 0.9rem;
    font-style: italic;
    opacity: 0.7;
  }

  .defense-indicator {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
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

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 300px;
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
    gap: 0.5rem;
    position: relative;
  }

  .action-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  .attack-counter {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    border: 1px solid rgba(255, 255, 255, 0.3);
    min-width: 40px;
    text-align: center;
  }

  .action-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .build-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .attack-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .defend-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .action-desc {
    font-size: 0.8rem;
    opacity: 0.9;
  }

  .requirement {
    font-size: 0.7rem;
    opacity: 0.8;
    position: absolute;
    bottom: 0.25rem;
    left: 50%;
    transform: translateX(-50%);
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

  .main-menu-btn {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.2rem;
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
    }
    50% {
      transform: scale(1.01);
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

  @keyframes block-appear {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 480px) {
    .game-container {
      padding: 0.5rem;
      gap: 1rem;
      padding-top: 4.5rem;
    }
    
    .towers-container {
      gap: 0.75rem;
    }
    
    .tower-display {
      padding: 0.75rem;
      min-height: 150px;
    }
    
    .tower-header h3 {
      font-size: 1rem;
    }
    
    .tower-icon {
      font-size: 1.2rem;
    }
    
    .action-btn {
      padding: 0.75rem;
      font-size: 0.9rem;
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

  @media (max-width: 360px) {
    .towers-container {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .tower-section {
      max-width: 280px;
      margin: 0 auto;
    }
  }
</style>