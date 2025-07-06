<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { gameModes } from '../gameModes';
  import type { GameManager } from '../core/GameManager';

  export let gameManager: GameManager;

  const dispatch = createEventDispatcher();

  let joinCode = '';
  let showRoomCode = false;
  let playerName = '';
  let showNameInput = false;
  let turnTimeLimit = 0;
  let selectedGameMode = 'color-duel';
  let maxTowerWarAttacks = 10;
  let brainstormingTargetScore = 10;
  let brainstormingLanguage = 'HU';
  let activeTab = 'color-duel';
  let nameInputFocused = false;
  let canShare = false;

  $: isHost = gameManager.getIsHost();
  $: roomCode = gameManager.getRoomCode();
  $: connecting = gameManager.getConnecting();
  $: connected = gameManager.getConnected();
  $: errorMessage = gameManager.getErrorMessage();
  $: myPlayerInfo = gameManager.getMyPlayerInfo();

  // Reactive validation for player name
  $: isNameValid = playerName.trim().length > 0;
  $: showNameError = showNameInput && !isNameValid && !nameInputFocused;

  onMount(() => {
    if (navigator.share) {
      canShare = true;
    }
  });

  function handleCreateRoom() {
    if (!playerName.trim()) {
      showNameInput = true;
      return;
    }
    
    gameManager.setPlayerName(playerName.trim());
    
    const settings = { 
      turnTimeLimit, 
      gameMode: selectedGameMode 
    };
    
    // Add Tower War specific settings if that mode is selected
    if (selectedGameMode === 'tower-war') {
      settings.towerWarSettings = {
        maxAttacks: maxTowerWarAttacks
      };
    }
    
    // Add Brainstorming specific settings if that mode is selected
    if (selectedGameMode === 'brainstorming') {
      settings.brainstormingSettings = {
        targetScore: brainstormingTargetScore,
        language: brainstormingLanguage
      };
    }
    
    gameManager.setGameSettings(settings);
    gameManager.createRoom();
  }

  function handleJoinRoom() {
    if (!playerName.trim()) {
      showNameInput = true;
      return;
    }
    
    if (joinCode.trim() && playerName.trim()) {
      gameManager.setPlayerName(playerName.trim());
      gameManager.joinRoom(joinCode.trim());
    }
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode);
    showRoomCode = true;
    setTimeout(() => {
      showRoomCode = false;
    }, 2000);
  }

  function handleNameSubmit() {
    if (playerName.trim()) {
      showNameInput = false;
      gameManager.setPlayerName(playerName.trim());
    }
  }

  function handleNameInput(event) {
    const value = event.target.value;
    // Limit to 12 characters
    if (value.length <= 12) {
      playerName = value;
    } else {
      // Truncate and update the input field
      playerName = value.slice(0, 12);
      event.target.value = playerName;
    }
  }

  async function handleShareRoom() {
    if (navigator.share && roomCode) {
      try {
        const shareUrl = window.location.origin;
        const shareText = `Join my Color Duel P2P Game! Room Code: ${roomCode}\n\nClick here to play: ${shareUrl}`;
        await navigator.share({
          title: 'Color Duel P2P Game Invitation',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // Handle permission denied errors as warnings since they're expected
        if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
          console.warn('Share permission denied, falling back to clipboard:', error.message);
        } else {
          console.error('Error sharing:', error);
        }
        // Fallback: copy to clipboard if sharing fails
        try {
          const shareText = `Join my Color Duel P2P Game! Room Code: ${roomCode}\n\nPlay at: ${window.location.origin}`;
          await navigator.clipboard.writeText(shareText);
          showRoomCode = true;
          setTimeout(() => {
            showRoomCode = false;
          }, 2000);
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
        }
      }
    }
  }

  // Auto-focus name input when it becomes visible
  $: if (showNameInput) {
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) input.focus();
    }, 100);
  }
</script>

<div class="lobby">
  <div class="header">
    <h1>🎮 Shadow Games</h1>
    <p>Battle your friend in strategic games!</p>
    {#if errorMessage}
      <div class="error-message">
        ⚠️ {errorMessage}
      </div>
    {/if}
  </div>

  {#if showNameInput}
    <div class="name-input-section">
      <h2>Enter Your Name</h2>
      <p class="name-requirement">Please enter your player name (max 12 characters)</p>
      <div class="input-group">
        <input
          type="text"
          placeholder="Your player name"
          bind:value={playerName}
          maxlength="20"
          class:error={showNameError}
          class:valid={isNameValid && playerName.length > 0}
          on:keydown={(e) => e.key === 'Enter' && handleNameSubmit()}
          on:input={handleNameInput}
          on:focus={() => nameInputFocused = true}
          on:blur={() => nameInputFocused = false}
          autofocus
        />
        <div class="character-counter">
          {playerName.length}/12
        </div>
        <button 
          on:click={handleNameSubmit} 
          disabled={!isNameValid}
          class="primary-btn"
        >
          Continue
        </button>
      </div>
      {#if showNameError}
        <div class="name-error">
          ⚠️ Please enter a valid name to continue
        </div>
      {/if}
    </div>
  {:else}
    <div class="player-name-display">
      <p>Playing as: <strong>{playerName}</strong></p>
      <button class="change-name-btn" on:click={() => showNameInput = true}>
        Change Name
      </button>
    </div>
  {/if}

  {#if !isHost && !connected}
    <div class="section">
      <h2>Join Game</h2>
      <div class="input-group">
        <input
          type="text"
          placeholder="Enter room code"
          bind:value={joinCode}
          disabled={connecting || showNameInput}
          on:keydown={(e) => e.key === 'Enter' && handleJoinRoom()}
          on:input={(e) => {
            joinCode = e.target.value.toUpperCase();
          }}
          style="text-transform: uppercase;"
        />
        <button 
          on:click={handleJoinRoom} 
          disabled={connecting || !joinCode.trim() || showNameInput}
          class="primary-btn"
        >
          {connecting ? 'Joining...' : 'Join'}
        </button>
      </div>
    </div>

    <div class="divider">
      <span>or</span>
    </div>

    <div class="section">
      <h2>Create Room</h2>
      
      <div class="game-mode-setting">
        <label for="gameMode">Choose Game Mode:</label>
        <select 
          id="gameMode"
          bind:value={selectedGameMode}
          class="game-mode-select"
        >
          {#each gameModes as mode}
            <option value={mode.id}>{mode.name}</option>
          {/each}
        </select>
        <p class="game-description">
          {gameModes.find(m => m.id === selectedGameMode)?.description || ''}
        </p>
      </div>

      <div class="timer-setting">
        <label for="turnTimer">Turn Timer (seconds, 0 = unlimited):</label>
        <input 
          id="turnTimer"
          type="number" 
          bind:value={turnTimeLimit}
          min="0"
          max="300"
          step="5"
          class="timer-input"
          placeholder="0 = unlimited"
        />
      </div>
      
      {#if selectedGameMode === 'tower-war'}
        <div class="tower-war-setting">
          <label for="maxAttacks">Max attacks per player:</label>
          <input 
            id="maxAttacks"
            type="number" 
            bind:value={maxTowerWarAttacks}
            min="1"
            max="50"
            step="1"
            class="timer-input"
            placeholder="10"
          />
          <p class="setting-description">
            Each player can attack up to {maxTowerWarAttacks} times during the game
          </p>
        </div>
      {/if}
      
      {#if selectedGameMode === 'brainstorming'}
        <div class="brainstorming-setting">
          <label for="targetScore">Target score to win:</label>
          <input 
            id="targetScore"
            type="number" 
            bind:value={brainstormingTargetScore}
            min="0"
            max="50"
            step="5"
            class="timer-input"
            placeholder="10"
          />
          <p class="setting-description">
            {#if brainstormingTargetScore === 0}
              Play all questions, highest score wins
            {:else}
              First player to reach {brainstormingTargetScore} points wins
            {/if}
          </p>
          
          <label for="language">Question language:</label>
          <select 
            id="language"
            bind:value={brainstormingLanguage}
            class="game-mode-select"
          >
            <option value="HU">Hungarian 🇭🇺</option>
            <option value="EN">English 🇬🇧</option>
          </select>
          <p class="setting-description">
            Questions will be displayed in {brainstormingLanguage === 'HU' ? 'Hungarian' : 'English'}
          </p>
        </div>
      {/if}
      
      <button 
        on:click={handleCreateRoom} 
        disabled={connecting || showNameInput}
        class="primary-btn create-btn"
      >
        {connecting ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  {:else if isHost && roomCode && !connected}
    <div class="section">
      <h2>Room Created!</h2>
      <p>Share this code with your friend:</p>
      <div class="room-code-container">
        <div class="room-code">{roomCode}</div>
        <button on:click={copyRoomCode} class="copy-btn">
          {showRoomCode ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {#if canShare}
        <button on:click={handleShareRoom} class="share-btn">
          📤 Share Room
        </button>
      {/if}
      <p class="waiting-text">Waiting for player to join...</p>
    </div>
  {:else if connected}
    <div class="section">
      <h2>✅ Connected!</h2>
      <p>Both players are ready to play.</p>
    </div>
  {/if}

  <div class="rules">
    <div class="rules-header">
      <h3>Game Modes & Rules</h3>
      <div class="tab-buttons">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'color-duel'}
          on:click={() => activeTab = 'color-duel'}
        >
          🎯 Color Duel
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'tower-war'}
          on:click={() => activeTab = 'tower-war'}
        >
          🏗️ Tower War
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'shadow-code'}
          on:click={() => activeTab = 'shadow-code'}
        >
          🤫 Shadow Code
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'brainstorming'}
          on:click={() => activeTab = 'brainstorming'}
        >
          🧠 Brainstorming
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'general'}
          on:click={() => activeTab = 'general'}
        >
          ℹ️ General
        </button>
      </div>
    </div>
    
    <div class="tab-content">
      {#if activeTab === 'color-duel'}
        <div class="game-rules">
          <h4>🎯 Color Duel</h4>
          <p class="game-description">
            Classic tic-tac-toe with a strategic twist! Battle on a 3x3 grid where you can steal your opponent's cells.
          </p>
          
          <div class="rules-section">
            <h5>🎮 How to Play</h5>
            <ul>
              <li><strong>Goal:</strong> Get 3 of your colors in a row (horizontal, vertical, or diagonal)</li>
              <li><strong>Basic Move:</strong> Click any empty cell to place your color</li>
              <li><strong>Steal Move:</strong> Click an opponent's cell to steal it (once per game)</li>
              <li><strong>Turn Order:</strong> Red player always goes first</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>⚡ Steal Mechanic</h5>
            <ul>
              <li>Each player can steal <strong>one opponent cell</strong> during the entire game</li>
              <li>Stolen cells immediately become your color</li>
              <li>Use your steal wisely - it's a one-time power!</li>
              <li>Stealing can block opponent wins or create your own winning line</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🏆 Winning</h5>
            <ul>
              <li>First to get 3 in a row wins instantly</li>
              <li>Strategic stealing can turn the tide of battle</li>
              <li>Think ahead - every move counts!</li>
            </ul>
          </div>
        </div>
      {:else if activeTab === 'tower-war'}
        <div class="game-rules">
          <h4>🏗️ Tower War</h4>
          <p class="game-description">
            Build your tower to 10 levels while sabotaging your opponent's construction. Strategy meets destruction!
          </p>
          
          <div class="rules-section">
            <h5>🎮 How to Play</h5>
            <ul>
              <li><strong>Goal:</strong> Build your tower to 10 levels OR destroy your opponent's tower</li>
              <li><strong>Actions:</strong> Choose one action per turn - Build, Attack, or Defend</li>
              <li><strong>Turn Order:</strong> Red player goes first, then alternating turns</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>⚔️ Actions</h5>
            <ul>
              <li><strong>🏗️ Build:</strong> Add +1 level to your tower (always available)</li>
              <li><strong>💣 Attack:</strong> Remove -1 level from opponent's tower (requires 3+ levels, max 10 per game)</li>
              <li><strong>🛡️ Defend:</strong> Block the next attack against you (one-time use per activation)</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🏆 Winning Conditions</h5>
            <ul>
              <li><strong>Victory:</strong> First to reach 10 levels wins</li>
              <li><strong>Destruction:</strong> Reduce opponent's tower to 0 levels</li>
              <li><strong>Strategy:</strong> Balance building, attacking, and defending</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>💡 Pro Tips</h5>
            <ul>
              <li>Build to level 3 quickly to unlock attacks</li>
              <li>Use your 10 attacks wisely - they're limited!</li>
              <li>Use defense strategically when expecting attacks</li>
              <li>Sometimes attacking is better than building</li>
            </ul>
          </div>
        </div>
      {:else if activeTab === 'shadow-code'}
        <div class="game-rules">
          <h4>🤫 Shadow Code</h4>
          <p class="game-description">
            A strategic code-breaking game where you must crack your opponent's secret 3-digit code before they crack yours.
          </p>
          
          <div class="rules-section">
            <h5>🎮 How to Play</h5>
            <ul>
              <li><strong>Setup:</strong> Each player chooses a secret 3-digit code (numbers 1-9)</li>
              <li><strong>Goal:</strong> Be the first to guess your opponent's code correctly</li>
              <li><strong>Turns:</strong> Take turns making guesses about the opponent's code</li>
              <li><strong>Feedback:</strong> Get clues after each guess to help narrow down the code</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🔍 Feedback System</h5>
            <ul>
              <li><strong>🔵 Exact Match:</strong> Correct number in the correct position</li>
              <li><strong>🟡 Partial Match:</strong> Correct number but in the wrong position</li>
              <li><strong>❌ No Match:</strong> None of your guessed numbers are in the code</li>
              <li><strong>🎯 Perfect:</strong> All 3 numbers correct and in right positions = WIN!</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🧠 Strategy Tips</h5>
            <ul>
              <li>Start with diverse numbers to gather maximum information</li>
              <li>Pay attention to partial matches - they reveal which numbers are in the code</li>
              <li>Use process of elimination based on previous feedback</li>
              <li>Keep track of which numbers you've ruled out</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🎯 Example</h5>
            <ul>
              <li><strong>Secret Code:</strong> 4-7-2</li>
              <li><strong>Your Guess:</strong> 1-7-3 → Result: 🔵1 (7 is correct position)</li>
              <li><strong>Your Guess:</strong> 4-5-2 → Result: 🔵2 (4 and 2 are correct positions)</li>
              <li><strong>Your Guess:</strong> 4-7-2 → Result: 🎯 WIN!</li>
            </ul>
          </div>
        </div>
      {:else if activeTab === 'brainstorming'}
        <div class="game-rules">
          <h4>🧠 Brainstorming</h4>
          <p class="game-description">
            Test your knowledge in a fast-paced quiz battle. Answer questions correctly to earn points and reach the target score first!
          </p>
          
          <div class="rules-section">
            <h5>🎮 How to Play</h5>
            <ul>
              <li><strong>Goal:</strong> Be the first to reach the target score (default: 10 points)</li>
              <li><strong>Questions:</strong> Random mix of multiple choice and number input questions</li>
              <li><strong>Languages:</strong> Choose between Hungarian 🇭🇺 and English 🇬🇧</li>
              <li><strong>Simultaneous:</strong> Both players answer the same question at the same time</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>📝 Question Types</h5>
            <ul>
              <li><strong>Multiple Choice:</strong> Select the correct answer from 4 options</li>
              <li><strong>Number Input:</strong> Enter a numeric answer (year, quantity, etc.)</li>
              <li><strong>Exact vs Close:</strong> Number questions reward exact answers more than close ones</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🏆 Scoring System</h5>
            <ul>
              <li><strong>Multiple Choice:</strong> 1 point for correct answer, 0 for wrong</li>
              <li><strong>Number Questions:</strong> 2 points for exact answer, 1 point for close answer</li>
              <li><strong>Ties:</strong> If both players give the same wrong answer, both get points</li>
              <li><strong>Target:</strong> First to reach target score wins (configurable: 5-50 points)</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🧠 Strategy Tips</h5>
            <ul>
              <li>Speed matters - answer quickly but accurately</li>
              <li>For number questions, educated guesses can still earn points</li>
              <li>Pay attention to question patterns and topics</li>
              <li>Don't overthink multiple choice - first instinct is often right</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🌐 Languages Available</h5>
            <ul>
              <li><strong>Hungarian 🇭🇺:</strong> Questions about Hungarian history, culture, and general knowledge</li>
              <li><strong>English 🇬🇧:</strong> Same questions translated to English for international players</li>
              <li><strong>Expandable:</strong> Developers can easily add more languages and questions</li>
            </ul>
          </div>
        </div>
      {:else if activeTab === 'general'}
        <div class="game-rules">
          <h4>ℹ️ General Rules</h4>
          
          <div class="rules-section">
            <h5>🚀 Getting Started</h5>
            <ul>
              <li>Enter your player name</li>
              <li>Choose your game mode and settings</li>
              <li>Create a room or join with a code</li>
              <li>Wait for your opponent to join</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>⏱️ Turn Timer</h5>
            <ul>
              <li>Set time limits for each turn (0 = unlimited)</li>
              <li>Timer counts down during your turn</li>
              <li>Turn automatically skips when time runs out</li>
              <li>Choose wisely and quickly!</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🎨 Player Colors</h5>
            <ul>
              <li><span class="color-demo red"></span> Red player is always the host</li>
              <li><span class="color-demo blue"></span> Blue player joins the room</li>
              <li>Red player always goes first</li>
              <li>Colors are assigned automatically</li>
            </ul>
          </div>
          
          <div class="rules-section">
            <h5>🔄 Game Flow</h5>
            <ul>
              <li>Battle your friend in real-time</li>
              <li>Take turns making moves</li>
              <li>Game ends when someone wins</li>
              <li>Start a new game anytime!</li>
            </ul>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .lobby {
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }

  .header {
    margin-bottom: 3rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #333;
  }

  .header p {
    font-size: 1.1rem;
    color: #666;
    margin: 0.5rem 0 0 0;
  }

  .section {
    margin-bottom: 2rem;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .section h2 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .input-group {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .input-group input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .input-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .primary-btn {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-weight: 500;
  }

  .primary-btn:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .primary-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .create-btn {
    width: 100%;
    background-color: #10b981;
  }

  .create-btn:hover:not(:disabled) {
    background-color: #059669;
  }

  .room-code-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    justify-content: center;
  }

  .room-code {
    background-color: #1f2937;
    color: #f3f4f6;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-family: monospace;
    font-size: 1.8rem;
    font-weight: bold;
    letter-spacing: 4px;
    min-width: 150px;
    max-width: 200px;
    word-break: break-all;
    text-align: center;
  }

  .copy-btn {
    background-color: #6b7280;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .copy-btn:hover {
    background-color: #4b5563;
  }

  .share-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    margin-top: 1rem;
    width: 100%;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }

  .share-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .share-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .waiting-text {
    color: #6b7280;
    font-style: italic;
    margin-top: 1rem;
  }

  .divider {
    margin: 2rem 0;
    position: relative;
    color: #9ca3af;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #e5e7eb;
    z-index: 1;
  }

  .divider span {
    background-color: white;
    padding: 0 1rem;
    position: relative;
    z-index: 2;
  }

  .rules {
    margin-top: 3rem;
    background-color: #f1f5f9;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
    overflow: hidden;
  }

  .rules-header {
    padding: 1.5rem 2rem 0 2rem;
  }

  .rules-header h3 {
    margin: 0 0 1rem 0;
    color: #1e40af;
    text-align: center;
  }

  .tab-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0;
    justify-content: center;
    flex-wrap: wrap;
  }

  .tab-btn {
    background: rgba(255, 255, 255, 0.7);
    border: 2px solid #e2e8f0;
    padding: 0.75rem 1rem;
    border-radius: 8px 8px 0 0;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #64748b;
    min-width: 120px;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: #cbd5e1;
  }

  .tab-btn.active {
    background: white;
    border-color: #3b82f6;
    color: #1e40af;
    border-bottom-color: white;
    transform: translateY(2px);
    box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.1);
  }

  .tab-content {
    background: white;
    padding: 2rem;
    border-top: 2px solid #3b82f6;
  }

  .game-rules h4 {
    margin: 0 0 1rem 0;
    color: #1e40af;
    font-size: 1.3rem;
    text-align: center;
  }

  .game-description {
    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    color: #1e40af;
    font-style: italic;
    text-align: center;
    border: 1px solid #bfdbfe;
  }

  .rules-section {
    margin-bottom: 1.5rem;
  }

  .rules-section h5 {
    margin: 0 0 0.75rem 0;
    color: #374151;
    font-size: 1.1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .rules-section ul {
    text-align: left;
    color: #4b5563;
    margin: 0;
    padding-left: 1.5rem;
  }

  .error-message {
    background-color: #fef2f2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #fecaca;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .rules-section li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .rules-section li strong {
    color: #1f2937;
  }

  .color-demo {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 0.5rem;
    vertical-align: middle;
  }

  .color-demo.red {
    background-color: #ef4444;
  }

  .color-demo.blue {
    background-color: #3b82f6;
  }

  .name-input-section {
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
    border-radius: 12px;
    border: 2px solid #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .name-input-section h2 {
    color: #1e40af;
    margin-bottom: 1rem;
  }

  .name-requirement {
    color: #4b5563;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .input-group {
    position: relative;
  }

  .character-counter {
    position: absolute;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    color: #6b7280;
    background: rgba(255, 255, 255, 0.9);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    pointer-events: none;
    z-index: 1;
  }

  .input-group input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    animation: shake 0.5s ease-in-out;
  }

  .input-group input.valid {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  .name-error {
    background-color: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #fecaca;
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
    animation: fadeIn 0.3s ease-out;
  }

  .player-name-display {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .player-name-display p {
    margin: 0;
    color: #333;
  }

  .change-name-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .change-name-btn:hover {
    background: #4b5563;
  }

  .game-mode-setting {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .game-mode-setting label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }

  .game-mode-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
  }

  .game-mode-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .game-description {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #6b7280;
    font-style: italic;
  }

  .timer-setting {
    margin-bottom: 1rem;
    text-align: left;
  }

  .timer-setting label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }

  .timer-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
  }

  .timer-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .tower-war-setting {
    margin-bottom: 1rem;
    text-align: left;
  }

  .tower-war-setting label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }

  .setting-description {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #6b7280;
    font-style: italic;
  }

  .brainstorming-setting {
    margin-bottom: 1rem;
    text-align: left;
  }

  .brainstorming-setting label {
    display: block;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    color: #374151;
    font-weight: 500;
  }

  .brainstorming-setting label:first-child {
    margin-top: 0;
  }

  .country-war-setting {
    margin-bottom: 1rem;
    text-align: left;
  }

  .country-war-setting label {
    display: block;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    color: #374151;
    font-weight: 500;
  }

  .country-war-setting label:first-child {
    margin-top: 0;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(-10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .lobby {
      padding: 1rem;
      max-width: 100%;
    }
    
    .input-group {
      flex-direction: column;
    }
    
    .room-code-container {
      flex-direction: column;
    }
    
    .room-code {
      min-width: auto;
      width: 100%;
    }
    
    .player-name-display {
      flex-direction: column;
      text-align: center;
    }
    
    .tab-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .tab-btn {
      min-width: 200px;
      border-radius: 8px;
    }
    
    .tab-btn.active {
      transform: none;
    }
    
    .tab-content {
      padding: 1rem;
    }
    
    .character-counter {
      position: static;
      transform: none;
      margin-top: 0.5rem;
      text-align: center;
      background: transparent;
    }
    
    .input-group {
      flex-direction: column;
    }
  }
</style>