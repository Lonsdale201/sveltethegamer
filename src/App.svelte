<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { debugLog, debugError } from './config/debug';
  import Granim from 'granim';
  import Lobby from './components/Lobby.svelte';
  import PreLobby from './components/PreLobby.svelte';
  import { GameManager } from './core/GameManager';
  import { getGameMode } from './gameModes';
  import { TurnManager } from './core/TurnManager';
  import { makeMove, resetGame, skipTurn } from './gameModes/colorDuel/ColorDuelLogic';
  import type { GameMessage, Player } from './types/core';
  import type { ColorDuelGameState, MoveData } from './types/colorDuel';
  import type { TowerWarGameState, TowerWarMoveData } from './types/towerWar';
  import type { ShadowCodeGameState, ShadowCodeMoveData } from './types/shadowCode';
  import type { BrainstormingGameState, BrainstormingMoveData } from './types/brainstorming';

  let gameManager: GameManager | null = null;
  let gameState: ColorDuelGameState | TowerWarGameState | ShadowCodeGameState | BrainstormingGameState;
  let gradientCanvas: HTMLCanvasElement;
  let granim: any;
  let turnTimer: number | null = null;
  let currentGameMode: any = null;
  let feedbackTimer: number | null = null;

  // Reactive state from GameManager
  $: isHost = gameManager?.getIsHost() || false;
  $: myColor = gameManager?.getMyColor() || 'red';
  $: connected = gameManager?.getConnected() || false;
  $: gameStarted = gameManager?.getGameStarted() || false;
  $: inPreLobby = gameManager?.getInPreLobby() || false;
  $: myPlayerInfo = gameManager?.getMyPlayerInfo() || { id: '', name: '', color: 'red' };
  $: opponentInfo = gameManager?.getOpponentInfo() || null;
  $: gameSettings = gameManager?.getGameSettings() || { turnTimeLimit: 0, gameMode: 'color-duel' };

  // Reactive logging for main state variables
  $: {
    debugLog('App reactive state update:', {
      connected,
      gameStarted,
      inPreLobby,
      isHost,
      myColor,
      myPlayerInfo,
      opponentInfo,
      gameSettings
    });
  }

  // Reactive logging for gameState changes
  $: if (gameState) {
    debugLog('App gameState update:', {
      gameStarted: gameState.gameStarted,
      currentTurn: gameState.currentTurn,
      winner: gameState.winner,
      turnTimeLimit: gameState.turnTimeLimit,
      timeRemaining: gameState.timeRemaining,
      board: gameState.board
    });
  }

  // Update current game mode when settings change
  $: {
    if (gameSettings.gameMode) {
      currentGameMode = getGameMode(gameSettings.gameMode);
      if (currentGameMode && !gameStarted) {
        const newGameSettings = {
          ...gameSettings,
          turnMode: currentGameMode.turnMode
        };
        gameState = currentGameMode.gameLogic.resetGame(newGameSettings);
      }
    }
  }

  onMount(() => {
    gameManager = new GameManager(handleStateChange, handleGameMessage);
    
    // Initialize with default game mode
    currentGameMode = getGameMode('color-duel');
    if (currentGameMode) {
      gameState = currentGameMode.gameLogic.resetGame(gameManager.getGameSettings());
    }
    
    // Initialize Granim gradient animation
    granim = new Granim({
      element: gradientCanvas,
      direction: 'diagonal',
      isPausedWhenNotInView: true,
      states: {
        "default-state": {
          gradients: [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#a8edea', '#fed6e3'],
            ['#ffecd2', '#fcb69f'],
            ['#ff9a9e', '#fecfef'],
            ['#667eea', '#f093fb'],
            ['#764ba2', '#4facfe'],
            ['#f5576c', '#a8edea'],
            ['#00f2fe', '#fed6e3'],
            ['#fcb69f', '#fecfef'],
            ['#ff9a9e', '#667eea'],
            ['#ffecd2', '#764ba2'],
            ['#f093fb', '#4facfe'],
            ['#a8edea', '#f5576c']
          ],
          transitionSpeed: 3000
        }
      }
    });
  });

  onDestroy(() => {
    if (gameManager) {
      gameManager.disconnect();
    }
    if (granim) {
      granim.destroy();
    }
    if (turnTimer) {
      clearInterval(turnTimer);
    }
    if (feedbackTimer) {
      clearInterval(feedbackTimer);
    }
  });

  function handleStateChange() {
    // Force reactivity update
    gameManager = gameManager;
  }

  function handleGameMessage(message: GameMessage) {
    if (!currentGameMode) return;

    debugLog('App handleGameMessage:', message.type, message.data);

    switch (message.type) {
      case 'gameState':
        debugLog('App handleGameMessage gameState - before update:', gameState);
        gameState = message.data;
        debugLog('App handleGameMessage gameState - after update:', gameState);
        if (gameState.gameStarted && !gameState.winner) {
          startTurnTimer();
        }
        break;
      case 'move':
        debugLog('App handleGameMessage move - received data:', message.data);
        debugLog('App handleGameMessage move - gameState before makeMove:', gameState);
        
        if (gameSettings.gameMode === 'color-duel') {
          const moveData: MoveData = message.data;
          gameState = currentGameMode.gameLogic.makeMove(gameState, moveData.x, moveData.y, moveData.player);
        } else if (gameSettings.gameMode === 'tower-war') {
          const moveData: TowerWarMoveData = message.data;
          gameState = currentGameMode.gameLogic.makeMove(gameState, moveData.action, moveData.player);
        } else if (gameSettings.gameMode === 'shadow-code') {
          const moveData: ShadowCodeMoveData = message.data;
          gameState = currentGameMode.gameLogic.makeMove(gameState, moveData, moveData.player);
        } else if (gameSettings.gameMode === 'brainstorming') {
          const moveData: BrainstormingMoveData = message.data;
          gameState = currentGameMode.gameLogic.makeMove(gameState, moveData, moveData.player);
        }
        
        debugLog('App handleGameMessage move - gameState after makeMove:', gameState);
        startTurnTimer();
        break;
      case 'reset':
        gameState = currentGameMode.gameLogic.resetGame(gameSettings);
        startTurnTimer();
        break;
      case 'turnTimeout':
        gameState = currentGameMode.gameLogic.skipTurn(gameState);
        startTurnTimer();
        break;
      case 'startGame':
        debugLog('App: Starting game with settings:', gameSettings);
        // Initialize game state when receiving startGame message
        if (currentGameMode) {
          gameState = currentGameMode.gameLogic.resetGame(gameSettings);
          debugLog('App: Game state initialized for non-host:', gameState);
        }
        startTurnTimer();
        break;
    }
  }

  function handleMove(event: CustomEvent<{ x: number; y: number }>) {
    if (!gameManager || !connected || !gameStarted || !currentGameMode) return;
    
    if (gameSettings.gameMode === 'color-duel') {
      const { x, y } = event.detail;
      const newGameState = currentGameMode.gameLogic.makeMove(gameState, x, y, myColor);
      
      if (newGameState !== gameState) {
        gameState = newGameState;
        startTurnTimer();
        
        // Send move to peer
        gameManager.sendMessage({
          type: 'move',
          data: { x, y, player: myColor }
        });
      }
    } else if (gameSettings.gameMode === 'tower-war') {
      const { action } = event.detail;
      const newGameState = currentGameMode.gameLogic.makeMove(gameState, action, myColor);
      
      if (newGameState !== gameState) {
        gameState = newGameState;
        startTurnTimer();
        
        // Send move to peer
        gameManager.sendMessage({
          type: 'move',
          data: { action, player: myColor }
        });
      }
    } else if (gameSettings.gameMode === 'shadow-code') {
      const moveData = event.detail;
      const newGameState = currentGameMode.gameLogic.makeMove(gameState, moveData, myColor);
      
      if (newGameState !== gameState) {
        gameState = newGameState;
        startTurnTimer();
        
        // Send move to peer
        gameManager.sendMessage({
          type: 'move',
          data: moveData
        });
      }
    } else if (gameSettings.gameMode === 'brainstorming') {
      const moveData = event.detail;
      
      // For brainstorming, we need to handle simultaneous moves differently
      // Don't check if it's our turn - both players can answer at the same time
      if (currentGameMode.gameLogic.canMakeMove(gameState, moveData, myColor)) {
        const newGameState = currentGameMode.gameLogic.makeMove(gameState, moveData, myColor);
        
        if (newGameState !== gameState) {
          gameState = newGameState;
          // Don't restart timer here - let the logic handle timing
          
          // Send move to peer
          gameManager.sendMessage({
            type: 'move',
            data: moveData
          });
        }
      }
    }
  }

  function handleBrainstormingMove(event: CustomEvent) {
    if (!gameManager || !connected || !gameStarted || !currentGameMode) return;
    
    const moveData = event.detail;
    
    // For brainstorming, allow moves regardless of turn
    if (currentGameMode.gameLogic.canMakeMove(gameState, moveData, myColor)) {
      const newGameState = currentGameMode.gameLogic.makeMove(gameState, moveData, myColor);
      
      if (newGameState !== gameState) {
        gameState = newGameState;
        
        // Only restart timer if both players answered (moving to next question)
        if (newGameState.answersSubmitted?.red && newGameState.answersSubmitted?.blue) {
          startTurnTimer();
        }
        
        // Send move to peer
        gameManager.sendMessage({
          type: 'move',
          data: moveData
        });
      }
    }
  }

  function handleReset() {
    if (!gameManager || !connected || !currentGameMode) return;
    
    gameState = currentGameMode.gameLogic.resetGame(gameSettings);
    startTurnTimer();
    
    // Send reset to peer
    gameManager.sendMessage({
      type: 'reset',
      data: {}
    });
  }

  function handleMainMenu() {
    if (!gameManager) return;
    
    debugLog('App: Returning to main menu');
    gameManager.resetToMainMenu();
  }

  function startTurnTimer() {
    // Clear existing timer
    if (turnTimer) {
      clearInterval(turnTimer);
      turnTimer = null;
    }

    // Don't start timer if game is over, unlimited time, or showing feedback
    if (!gameState.gameStarted || gameState.winner || gameState.turnTimeLimit === 0 || gameState.showingFeedback) {
      return;
    }

    // Handle feedback timer for brainstorming
    if (gameSettings.gameMode === 'brainstorming' && gameState.showingFeedback) {
      startFeedbackTimer();
      return;
    }

    // Update turn start time and remaining time
    const now = Date.now();
    gameState = { 
      ...gameState, 
      turnStartTime: now, 
      timeRemaining: gameState.turnTimeLimit 
    };

    // Start countdown timer
    turnTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
      const newTimeRemaining = Math.max(0, gameState.turnTimeLimit - elapsed);
      
      // Only update if time changed to avoid unnecessary re-renders
      if (newTimeRemaining !== gameState.timeRemaining) {
        gameState = { ...gameState, timeRemaining: newTimeRemaining };
      }

      // Check if time is up
      if (newTimeRemaining <= 0) {
        handleTurnTimeout();
      }
    }, 100); // Update every 100ms for smooth countdown
  }

  function startFeedbackTimer() {
    // Clear existing feedback timer
    if (feedbackTimer) {
      clearInterval(feedbackTimer);
      feedbackTimer = null;
    }

    // Start feedback countdown timer
    feedbackTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.feedbackStartTime) / 1000);
      const newTimeRemaining = Math.max(0, 6 - elapsed);
      
      // Only update if time changed
      if (newTimeRemaining !== gameState.feedbackTimeRemaining) {
        gameState = { ...gameState, feedbackTimeRemaining: newTimeRemaining };
      }

      // Check if feedback time is up
      if (newTimeRemaining <= 0) {
        handleFeedbackTimeout();
      }
    }, 100);
  }

  function handleFeedbackTimeout() {
    if (!gameManager || !connected) return;

    // Clear feedback timer
    if (feedbackTimer) {
      clearInterval(feedbackTimer);
      feedbackTimer = null;
    }

    // Handle feedback timeout (advance to next question)
    gameState = currentGameMode.gameLogic.skipTurn(gameState);
    
    // Send timeout message to peer
    gameManager.sendMessage({
      type: 'turnTimeout',
      data: {}
    });

    // Start timer for next turn if not showing feedback
    if (!gameState.showingFeedback) {
      startTurnTimer();
    }
  }

  function handleTurnTimeout() {
    if (!gameManager || !connected) return;

    // Clear timer
    if (turnTimer) {
      clearInterval(turnTimer);
      turnTimer = null;
    }

    // Skip turn
    gameState = currentGameMode.gameLogic.skipTurn(gameState);
    
    // Send timeout message to peer
    gameManager.sendMessage({
      type: 'turnTimeout',
      data: {}
    });

    // Start timer for next turn
    startTurnTimer();
  }

  // Watch for feedback state changes in brainstorming
  $: if (gameSettings.gameMode === 'brainstorming' && gameState?.showingFeedback) {
    startFeedbackTimer();
  } else if (feedbackTimer && (!gameState?.showingFeedback || gameSettings.gameMode !== 'brainstorming')) {
    clearInterval(feedbackTimer);
    feedbackTimer = null;
  }
</script>

<canvas bind:this={gradientCanvas} class="gradient-canvas"></canvas>
<main>
  {#if gameManager && (!connected || (!inPreLobby && !gameStarted))}
    <Lobby {gameManager} />
  {:else if gameManager && inPreLobby}
    <PreLobby {gameManager} />
  {:else if gameManager && gameStarted && currentGameMode}
    <svelte:component 
      this={currentGameMode.component}
      {gameState}
      {myColor}
      {connected}
      {myPlayerInfo}
      {opponentInfo}
      {gameSettings}
      on:move={handleMove}
      on:reset={handleReset}
     on:mainMenu={handleMainMenu}
    />
  {/if}
</main>

<style>
  .gradient-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  main {
    min-height: 100vh;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8fafc;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>