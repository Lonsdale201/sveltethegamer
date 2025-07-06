import { debugLog } from '../config/debug';
import type { BaseGameState, Player, TurnMode, TurnState } from '../types/core';

export class TurnManager {
  /**
   * Initialize turn state for a game
   */
  static initializeTurnState(turnMode: TurnMode): TurnState {
    return {
      mode: turnMode,
      playersReady: { red: false, blue: false },
      actionsSubmitted: { red: false, blue: false },
      waitingForPlayers: false
    };
  }

  /**
   * Check if a player can make a move based on turn mode
   */
  static canPlayerAct(gameState: BaseGameState, player: Player): boolean {
    if (!gameState.turnState) {
      // Fallback to traditional turn-based logic
      return gameState.currentTurn === player;
    }

    const { mode, actionsSubmitted, waitingForPlayers } = gameState.turnState;

    if (mode === 'sequential') {
      return gameState.currentTurn === player && !waitingForPlayers;
    }

    if (mode === 'simultaneous') {
      // In simultaneous mode, both players can act if they haven't submitted yet
      return !actionsSubmitted[player] && !waitingForPlayers;
    }

    return false;
  }

  /**
   * Handle a player action submission
   */
  static handlePlayerAction<T extends BaseGameState>(
    gameState: T, 
    player: Player, 
    actionHandler: (state: T) => T
  ): T {
    if (!gameState.turnState) {
      // Fallback to traditional logic
      return actionHandler(gameState);
    }

    const { mode } = gameState.turnState;
    
    if (mode === 'sequential') {
      return TurnManager.handleSequentialAction(gameState, player, actionHandler);
    }

    if (mode === 'simultaneous') {
      return TurnManager.handleSimultaneousAction(gameState, player, actionHandler);
    }

    return gameState;
  }

  /**
   * Handle sequential (traditional) turn-based action
   */
  private static handleSequentialAction<T extends BaseGameState>(
    gameState: T, 
    player: Player, 
    actionHandler: (state: T) => T
  ): T {
    if (!TurnManager.canPlayerAct(gameState, player)) {
      return gameState;
    }

    const newState = actionHandler(gameState);
    
    // Switch turns
    newState.currentTurn = player === 'red' ? 'blue' : 'red';
    newState.turnStartTime = Date.now();
    newState.timeRemaining = gameState.turnTimeLimit;

    return newState;
  }

  /**
   * Handle simultaneous action
   */
  private static handleSimultaneousAction<T extends BaseGameState>(
    gameState: T, 
    player: Player, 
    actionHandler: (state: T) => T
  ): T {
    if (!TurnManager.canPlayerAct(gameState, player)) {
      return gameState;
    }

    const newState = actionHandler(gameState);
    
    if (!newState.turnState) return newState;

    // Mark this player as having submitted
    newState.turnState = {
      ...newState.turnState,
      actionsSubmitted: {
        ...newState.turnState.actionsSubmitted,
        [player]: true
      }
    };

    // Check if both players have submitted
    const bothSubmitted = newState.turnState.actionsSubmitted.red && 
                          newState.turnState.actionsSubmitted.blue;

    if (bothSubmitted) {
      // Reset for next round
      newState.turnState.actionsSubmitted = { red: false, blue: false };
      newState.turnState.waitingForPlayers = false;
      
      // Switch current turn for UI indication (optional)
      newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
      newState.turnStartTime = Date.now();
      newState.timeRemaining = gameState.turnTimeLimit;
      
      debugLog('TurnManager: Both players submitted, advancing to next round');
    } else {
      // Mark as waiting for the other player
      newState.turnState.waitingForPlayers = true;
      debugLog('TurnManager: Waiting for other player to submit');
    }

    return newState;
  }

  /**
   * Handle turn timeout
   */
  static handleTurnTimeout<T extends BaseGameState>(
    gameState: T, 
    timeoutHandler: (state: T) => T
  ): T {
    if (!gameState.turnState) {
      // Fallback to traditional logic
      return timeoutHandler(gameState);
    }

    const { mode } = gameState.turnState;

    if (mode === 'sequential') {
      return TurnManager.handleSequentialTimeout(gameState, timeoutHandler);
    }

    if (mode === 'simultaneous') {
      return TurnManager.handleSimultaneousTimeout(gameState, timeoutHandler);
    }

    return gameState;
  }

  /**
   * Handle sequential timeout
   */
  private static handleSequentialTimeout<T extends BaseGameState>(
    gameState: T, 
    timeoutHandler: (state: T) => T
  ): T {
    const newState = timeoutHandler(gameState);
    
    // Switch turns
    newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
    newState.turnStartTime = Date.now();
    newState.timeRemaining = gameState.turnTimeLimit;

    return newState;
  }

  /**
   * Handle simultaneous timeout
   */
  private static handleSimultaneousTimeout<T extends BaseGameState>(
    gameState: T, 
    timeoutHandler: (state: T) => T
  ): T {
    if (!gameState.turnState) return gameState;

    const newState = timeoutHandler(gameState);
    
    // Reset submission states and advance
    newState.turnState.actionsSubmitted = { red: false, blue: false };
    newState.turnState.waitingForPlayers = false;
    
    // Switch current turn for UI indication
    newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
    newState.turnStartTime = Date.now();
    newState.timeRemaining = gameState.turnTimeLimit;

    return newState;
  }

  /**
   * Check if we're waiting for players in simultaneous mode
   */
  static isWaitingForPlayers(gameState: BaseGameState): boolean {
    return gameState.turnState?.waitingForPlayers ?? false;
  }

  /**
   * Check if a player has submitted their action in simultaneous mode
   */
  static hasPlayerSubmitted(gameState: BaseGameState, player: Player): boolean {
    return gameState.turnState?.actionsSubmitted[player] ?? false;
  }

  /**
   * Get the turn mode
   */
  static getTurnMode(gameState: BaseGameState): TurnMode {
    return gameState.turnState?.mode ?? 'sequential';
  }
}