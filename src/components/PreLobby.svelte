<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GameManager } from '../core/GameManager';
  import { getGameMode } from '../gameModes';

  export let gameManager: GameManager;

  const dispatch = createEventDispatcher();

  $: isHost = gameManager.getIsHost();
  $: myPlayerInfo = gameManager.getMyPlayerInfo();
  $: opponentInfo = gameManager.getOpponentInfo();
  $: gameSettings = gameManager.getGameSettings();
  $: selectedGameMode = getGameMode(gameSettings.gameMode);

  function handleStartGame() {
    gameManager.startGame();
  }

  function handleKickPlayer() {
    gameManager.kickPlayer();
  }
</script>

<div class="pre-lobby">
  <div class="header">
    <h1>🎮 Game Lobby</h1>
    <p>Players are ready to battle!</p>
    {#if selectedGameMode}
      <div class="game-mode-info">
        <h3>{selectedGameMode.name}</h3>
        <p>{selectedGameMode.description}</p>
      </div>
    {/if}
  </div>

  <div class="players-section">
    <h2>Players ({opponentInfo ? 2 : 1}/2)</h2>
    
    <div class="players-list">
      <!-- My player card -->
      <div class="player-card {myPlayerInfo.color}">
        <div class="player-avatar">
          <div class="color-indicator {myPlayerInfo.color}"></div>
        </div>
        <div class="player-info">
          <div class="player-name">{myPlayerInfo.name || 'Anonymous'}</div>
          <div class="player-role">
            {#if myPlayerInfo.color === 'red'}
              Host • Red Player
            {:else}
              Player 2 • Blue Player
            {/if}
          </div>
        </div>
        <div class="you-badge">TE VAGY</div>
      </div>

      <!-- Opponent player card -->
      {#if opponentInfo}
        <div class="player-card {opponentInfo.color}">
          <div class="player-avatar">
            <div class="color-indicator {opponentInfo.color}"></div>
          </div>
          <div class="player-info">
            <div class="player-name">{opponentInfo.name || 'Anonymous'}</div>
            <div class="player-role">
              {#if opponentInfo.color === 'red'}
                Host • Red Player
              {:else}
                Player 2 • Blue Player
              {/if}
            </div>
          </div>
          {#if isHost}
            <button class="kick-btn" on:click={handleKickPlayer} title="Remove player">
              ❌
            </button>
          {/if}
        </div>
      {:else}
        <div class="player-card empty">
          <div class="player-avatar">
            <div class="waiting-indicator">⏳</div>
          </div>
          <div class="player-info">
            <div class="player-name">Waiting for opponent...</div>
            <div class="player-role">
              {#if myPlayerInfo.color === 'red'}
                Blue Player
              {:else}
                Red Player
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="game-settings">
    <h3>Game Settings</h3>
    <div class="settings-grid">
      <div class="setting-item">
        <span class="setting-label">Turn Timer:</span>
        <span class="setting-value">
          {gameSettings.turnTimeLimit === 0 ? 'Unlimited' : `${gameSettings.turnTimeLimit}s`}
        </span>
      </div>
    </div>
  </div>

  {#if isHost}
    <div class="host-controls">
      {#if opponentInfo}
        <button class="start-btn" on:click={handleStartGame}>
          🚀 Start Game
        </button>
      {:else}
        <div class="waiting-message">
          Waiting for a player to join...
        </div>
      {/if}
    </div>
  {:else}
    <div class="player-waiting">
      <div class="waiting-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p>Waiting for host to start the game...</p>
    </div>
  {/if}
</div>

<style>
  .pre-lobby {
    max-width: 700px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .header {
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #333;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header p {
    font-size: 1.1rem;
    color: #666;
    margin: 0.5rem 0 0 0;
  }

  .game-mode-info {
    margin-top: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
    border-radius: 12px;
    border: 2px solid #3b82f6;
  }

  .game-mode-info h3 {
    margin: 0 0 0.5rem 0;
    color: #1e40af;
    font-size: 1.3rem;
  }

  .game-mode-info p {
    margin: 0;
    color: #4b5563;
    font-size: 0.9rem;
  }

  .players-section h2 {
    color: #333;
    margin-bottom: 1.5rem;
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .player-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 12px;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
    position: relative;
  }

  .player-card.red {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2, #f8f9fa);
  }

  .player-card.blue {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff, #f8f9fa);
  }

  .player-card.empty {
    border-style: dashed;
    opacity: 0.7;
  }

  .player-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    background: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .color-indicator {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  .color-indicator.red {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  .color-indicator.blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .waiting-indicator {
    font-size: 1.5rem;
    animation: pulse 2s infinite;
  }

  .player-info {
    flex: 1;
    text-align: left;
  }

  .player-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .player-role {
    font-size: 0.9rem;
    color: #666;
  }

  .you-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    letter-spacing: 0.5px;
  }

  .kick-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }

  .kick-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .game-settings {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #f1f5f9;
    border-radius: 12px;
  }

  .game-settings h3 {
    margin: 0 0 1rem 0;
    color: #334155;
  }

  .settings-grid {
    display: grid;
    gap: 0.5rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  .setting-label {
    font-weight: 500;
    color: #4b5563;
  }

  .setting-value {
    color: #1f2937;
    font-weight: bold;
  }

  .host-controls {
    margin-top: 2rem;
  }

  .start-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .waiting-message {
    color: #6b7280;
    font-style: italic;
    padding: 1rem;
  }

  .player-waiting {
    margin-top: 2rem;
  }

  .waiting-animation {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .dot {
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  @media (max-width: 480px) {
    .pre-lobby {
      padding: 1rem;
      max-width: 100%;
    }
    
    .player-card {
      padding: 1rem;
    }
    
    .player-avatar {
      width: 50px;
      height: 50px;
    }
    
    .color-indicator {
      width: 30px;
      height: 30px;
    }
  }
</style>