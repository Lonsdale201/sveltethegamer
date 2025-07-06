<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
  import type { ShadowCodeGameState, ShadowCodeMoveData } from '../../types/shadowCode';
  import type { PlayerInfo, GameSettings } from '../../types/core';
  import type { Player } from '../../types/core';
  import { canMakeMove } from './ShadowCodeLogic';

  export let gameState: ShadowCodeGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  let myCode = [1, 1, 1];
  let currentGuess = [1, 1, 1];

  // Reactive logging for props
  $: {
    debugLog('ShadowCodeBoard reactive props update:', {
      gameState,
      myColor,
      connected,
      myPlayerInfo,
      opponentInfo
    });
  }

  function handleSetCode() {
    const moveData: ShadowCodeMoveData = {
      type: 'setCode',
      code: [...myCode],
      player: myColor
    };

    if (canMakeMove(gameState, moveData, myColor)) {
      debugLog('ShadowCodeBoard dispatching setCode:', moveData);
      dispatch('move', moveData);
    }
  }

  function handleMakeGuess() {
    const moveData: ShadowCodeMoveData = {
      type: 'makeGuess',
      guess: [...currentGuess],
      player: myColor
    };

    if (canMakeMove(gameState, moveData, myColor)) {
      debugLog('ShadowCodeBoard dispatching makeGuess:', moveData);
      dispatch('move', moveData);
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

  function getResultIcon(exactMatches: number, partialMatches: number): string {
    if (exactMatches === 3) return '🎯';
    if (exactMatches > 0 && partialMatches > 0) return '🔵🟡';
    if (exactMatches > 0) return '🔵';
    if (partialMatches > 0) return '🟡';
    return '❌';
  }

  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: myGuesses = gameState.guesses[myColor];
  $: opponentGuesses = gameState.guesses[opponentColor];
  $: bothCodesSet = gameState.codeSet.red && gameState.codeSet.blue;
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

  {#if !gameState.gameStarted}
    <!-- Code Setting Phase -->
    <div class="setup-phase">
      <h2>🤫 Set Your Secret Code</h2>
      <p class="setup-instruction">Choose 3 numbers (1-9) that your opponent must guess</p>
      
      <div class="code-input">
        <h3>Your Secret Code:</h3>
        <div class="number-selectors">
          {#each myCode as digit, index}
            <div class="number-selector">
              <button 
                class="number-btn up" 
                on:click={() => myCode[index] = Math.min(9, myCode[index] + 1)}
              >
                ▲
              </button>
              <div class="number-display">{digit}</div>
              <button 
                class="number-btn down" 
                on:click={() => myCode[index] = Math.max(1, myCode[index] - 1)}
              >
                ▼
              </button>
            </div>
          {/each}
        </div>
        
        {#if !gameState.codeSet[myColor]}
          <button class="set-code-btn" on:click={handleSetCode}>
            🔒 Lock In Code
          </button>
        {:else}
          <div class="code-set-indicator">
            ✅ Your code is set! Waiting for opponent...
          </div>
        {/if}
      </div>

      <div class="setup-status">
        <div class="status-item" class:completed={gameState.codeSet[myColor]}>
          <span class="color-indicator {myColor}"></span>
          <span>{myPlayerInfo?.name || 'You'}: {gameState.codeSet[myColor] ? 'Ready' : 'Setting code...'}</span>
        </div>
        <div class="status-item" class:completed={gameState.codeSet[opponentColor]}>
          <span class="color-indicator {opponentColor}"></span>
          <span>{opponentInfo?.name || 'Opponent'}: {gameState.codeSet[opponentColor] ? 'Ready' : 'Setting code...'}</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- Game Phase -->
    <div class="game-phase">
      <div class="game-grid">
        <!-- My Guesses -->
        <div class="guess-section my-section">
          <h3>🔍 Your Guesses</h3>
          <div class="guess-history">
            {#each myGuesses as guess, index}
              <div class="guess-row">
                <div class="guess-numbers">
                  {#each guess.guess as digit}
                    <span class="guess-digit">{digit}</span>
                  {/each}
                </div>
                <div class="guess-result">
                  <div class="result-dots">
                    <!-- Exact match dots (blue) -->
                    {#each Array(guess.exactMatches) as _, i}
                      <div class="result-dot exact"></div>
                    {/each}
                    <!-- Partial match dots (yellow) -->
                    {#each Array(guess.partialMatches) as _, i}
                      <div class="result-dot partial"></div>
                    {/each}
                    <!-- Empty dots to fill up to 3 total -->
                    {#each Array(3 - guess.exactMatches - guess.partialMatches) as _, i}
                      <div class="result-dot empty"></div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
            
            {#if myGuesses.length === 0}
              <div class="no-guesses">No guesses yet</div>
            {/if}
          </div>
          
          {#if gameState.currentTurn === myColor && !gameState.winner}
            <div class="current-guess">
              <h4>Make Your Guess:</h4>
              <div class="number-selectors">
                {#each currentGuess as digit, index}
                  <div class="number-selector">
                    <button 
                      class="number-btn up" 
                      on:click={() => currentGuess[index] = Math.min(9, currentGuess[index] + 1)}
                    >
                      ▲
                    </button>
                    <div class="number-display">{digit}</div>
                    <button 
                      class="number-btn down" 
                      on:click={() => currentGuess[index] = Math.max(1, currentGuess[index] - 1)}
                    >
                      ▼
                    </button>
                  </div>
                {/each}
              </div>
              <button class="guess-btn" on:click={handleMakeGuess}>
                🎯 Submit Guess
              </button>
            </div>
          {/if}
        </div>

        <!-- Opponent Guesses -->
        <div class="guess-section opponent-section">
          <h3>👁️ Opponent's Guesses</h3>
          <div class="guess-history">
            {#each opponentGuesses as guess, index}
              <div class="guess-row">
                <div class="guess-numbers">
                  {#each guess.guess as digit}
                    <span class="guess-digit">{digit}</span>
                  {/each}
                </div>
                <div class="guess-result">
                  <div class="result-dots">
                    <!-- Exact match dots (blue) -->
                    {#each Array(guess.exactMatches) as _, i}
                      <div class="result-dot exact"></div>
                    {/each}
                    <!-- Partial match dots (yellow) -->
                    {#each Array(guess.partialMatches) as _, i}
                      <div class="result-dot partial"></div>
                    {/each}
                    <!-- Empty dots to fill up to 3 total -->
                    {#each Array(3 - guess.exactMatches - guess.partialMatches) as _, i}
                      <div class="result-dot empty"></div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
            
            {#if opponentGuesses.length === 0}
              <div class="no-guesses">No guesses yet</div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        <h4>🔑 Legend:</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="result-dot exact"></div>
            <span>Correct number, correct position</span>
          </div>
          <div class="legend-item">
            <div class="result-dot partial"></div>
            <span>Correct number, wrong position</span>
          </div>
          <div class="legend-item">
            <div class="result-dot empty"></div>
            <span>No matches</span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if gameState.winner}
    <div class="game-over-overlay">
      <div class="game-over-popup" on:click|stopPropagation>
        {#if gameState.winner === myColor}
          <div class="win-content">
            <div class="win-emoji">🕵️</div>
            <h2>Code Cracked!</h2>
            <p>You successfully decoded the secret!</p>
          </div>
        {:else}
          <div class="lose-content">
            <div class="lose-emoji">🤐</div>
            <h2>Code Secure</h2>
            <p>Your opponent cracked your code first...</p>
          </div>
        {/if}
        <button on:click={() => dispatch('reset')} class="reset-btn">
          New Mission
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

  .setup-phase {
    width: 100%;
    max-width: 500px;
    text-align: center;
  }

  .setup-phase h2 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .setup-instruction {
    color: #666;
    margin-bottom: 2rem;
    font-style: italic;
  }

  .code-input {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .code-input h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .number-selectors {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .number-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .number-btn {
    background: #3b82f6;
    color: white;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
  }

  .number-btn:hover {
    background: #2563eb;
    transform: scale(1.1);
  }

  .number-display {
    background: #1f2937;
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
  }

  .set-code-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .set-code-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .code-set-indicator {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: bold;
  }

  .setup-status {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
  }

  .status-item.completed {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
  }

  .game-phase {
    width: 100%;
    max-width: 800px;
  }

  .game-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .guess-section {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .guess-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    text-align: center;
  }

  .my-section {
    border-left: 4px solid #10b981;
  }

  .opponent-section {
    border-left: 4px solid #ef4444;
  }

  .guess-history {
    min-height: 200px;
    margin-bottom: 1rem;
  }

  .guess-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .guess-numbers {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-start;
  }

  .guess-digit {
    background: #1f2937;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-family: 'Courier New', monospace;
    font-size: 1.2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .guess-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .result-dots {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .result-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .result-dot.exact {
    background: #3b82f6;
    border-color: #2563eb;
    color: white;
  }

  .result-dot.partial {
    background: #f59e0b;
    border-color: #d97706;
    color: white;
  }

  .result-dot.empty {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #9ca3af;
  }

  .no-guesses {
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    padding: 2rem;
  }

  .current-guess {
    border-top: 2px solid #e5e7eb;
    padding-top: 1rem;
    text-align: center;
  }

  .current-guess h4 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .guess-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;
  }

  .guess-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  .legend {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .legend h4 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .legend-items {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
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

  @media (max-width: 768px) {
    .game-container {
      padding: 0.5rem;
      gap: 1rem;
      padding-top: 4.5rem;
    }
    
    .game-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .number-selectors {
      gap: 0.75rem;
    }
    
    .number-display {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
    }
    
    .number-btn {
      width: 25px;
      height: 25px;
      font-size: 0.7rem;
    }
    
    .legend-items {
      flex-direction: column;
      gap: 1rem;
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