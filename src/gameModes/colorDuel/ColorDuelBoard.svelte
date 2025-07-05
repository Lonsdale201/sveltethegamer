<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ColorDuelGameState, Player, Cell } from '../../types/colorDuel';
  import type { PlayerInfo } from '../../types/core';
  import { canMakeMove } from './ColorDuelLogic';

  export let gameState: ColorDuelGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;

  const dispatch = createEventDispatcher();

  // Reactive logging for props
  $: {
    console.log('ColorDuelBoard reactive props update:', {
      gameState: gameState ? {
        gameStarted: gameState.gameStarted,
        currentTurn: gameState.currentTurn,
        winner: gameState.winner,
        turnTimeLimit: gameState.turnTimeLimit,
        timeRemaining: gameState.timeRemaining,
        board: gameState.board
      } : null,
      myColor,
      connected,
      myPlayerInfo,
      opponentInfo
    });
  }

  function handleCellClick(x: number, y: number) {
    const canMove = canMakeMove(gameState, x, y, myColor);
    console.log('ColorDuelBoard handleCellClick:', {
      x,
      y,
      myColor,
      canMove,
      gameState: {
        gameStarted: gameState.gameStarted,
        currentTurn: gameState.currentTurn,
        winner: gameState.winner
      },
      cellValue: gameState.board[x][y]
    });
    
    if (canMakeMove(gameState, x, y, myColor)) {
      console.log('ColorDuelBoard dispatching move event:', { x, y });
      dispatch('move', { x, y });
    } else {
      console.log('ColorDuelBoard move blocked - canMakeMove returned false');
    }
  }

  function getCellClass(cell: Cell, x: number, y: number): string {
    let classes = 'cell';
    
    if (cell === 'red') classes += ' red';
    else if (cell === 'blue') classes += ' blue';
    else classes += ' empty';
    
    if (canMakeMove(gameState, x, y, myColor)) {
      classes += ' clickable';
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
</script>

<div class="game-container">
  <div class="game-status">
    {#if connected && gameState.gameStarted && !gameState.winner && gameState.turnTimeLimit > 0}
      <div class="turn-timer" class:urgent={gameState.timeRemaining <= 5}>
        <div class="timer-label">Time remaining:</div>
        <div class="timer-display">
          {formatTime(gameState.timeRemaining)}
        </div>
        <div class="timer-bar">
          <div 
            class="timer-progress" 
            style="width: {(gameState.timeRemaining / gameState.turnTimeLimit) * 100}%"
          ></div>
        </div>
      </div>
    {/if}
    
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
          <span class="color-indicator {myColor === 'red' ? 'blue' : 'red'}"></span>
          <span class="player-name">{opponentInfo?.name || 'Opponent'}</span>
          {#if gameState.currentTurn !== myColor}
            <span class="turn-indicator">← Their turn</span>
          {/if}
        </div>
      </div>
      <div class="player-info">
        {#if gameState.stolen[myColor]}
          <div class="steal-status">Steal used ✓</div>
        {:else}
          <div class="steal-status">Steal available</div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="board">
    {#each gameState.board as row, x}
      {#each row as cell, y}
        <button
          class={getCellClass(cell, x, y)}
          on:click={() => handleCellClick(x, y)}
          disabled={!canMakeMove(gameState, x, y, myColor)}
        >
          {#if cell !== 'empty'}
            <div class="cell-color {cell}"></div>
          {/if}
        </button>
      {/each}
    {/each}
  </div>

  {#if gameState.winner}
    <div class="game-over-overlay">
      <div class="game-over-popup" on:click|stopPropagation>
        {#if gameState.winner === myColor}
          <div class="win-content">
            <div class="win-emoji">🎉</div>
            <h2>Te nyertél!</h2>
            <p>GG</p>
          </div>
        {:else}
          <div class="lose-content">
            <div class="lose-emoji">😔</div>
            <h2>Vesztettél</h2>
          </div>
        {/if}
        <button on:click={() => dispatch('reset')} class="reset-btn">
          Új játék
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
    gap: 2rem;
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  .game-status {
    text-align: center;
  }

  .players-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0;
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

  .player-info {
    text-align: center;
    margin-top: 0.5rem;
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

  .steal-status {
    font-size: 0.9rem;
    color: #666;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .cell {
    width: 80px;
    height: 80px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .cell:hover.clickable {
    border-color: #999;
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .cell:active.clickable {
    transform: scale(0.95);
  }

  .cell:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .cell-color {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    animation: pop 0.3s ease;
  }

  .cell-color.red {
    background-color: #ef4444;
  }

  .cell-color.blue {
    background-color: #3b82f6;
  }

  .clickable.empty:hover::after {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: currentColor;
    opacity: 0.3;
  }

  .turn-timer {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
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
    margin-bottom: 0.5rem;
  }

  .timer-display {
    font-size: 2.5rem;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.5rem;
  }

  .urgent .timer-display {
    color: #ef4444;
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
    border-radius: 4px;
  }

  .urgent .timer-progress {
    background: linear-gradient(90deg, #ef4444, #dc2626);
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
    margin: 0;
    text-shadow: 2px 2px 4px rgba(239, 68, 68, 0.3);
  }

  .win-content p {
    font-size: 1.5rem;
    color: #666;
    margin: 0;
    font-weight: bold;
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

  @keyframes pop {
    0% { transform: scale(0); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
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

  @media (max-width: 480px) {
    .players-info {
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }
    
    .player-display {
      width: 100%;
      max-width: 250px;
      justify-content: center;
      padding: 0.75rem 1rem;
    }
    
    .vs-divider {
      order: 1;
      margin: 0.25rem 0;
      font-size: 1rem;
    }

    .cell {
      width: 60px;
      height: 60px;
    }
    
    .cell-color {
      width: 40px;
      height: 40px;
    }
    
    .timer-display {
      font-size: 1.8rem;
    }
  }
</style>