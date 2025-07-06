export type Player = 'red' | 'blue';

export interface PlayerInfo {
  id: string;
  name: string;
  color: Player;
}

export interface BaseGameState {
  gameStarted: boolean;
  currentTurn: Player;
  winner: Player | null;
  turnTimeLimit: number;
  turnStartTime: number;
  timeRemaining: number;
}

export interface GameMessage {
  type: 'gameState' | 'move' | 'reset' | 'playerJoined' | 'playerInfo' | 'startGame' | 'kickPlayer' | 'requestPlayerInfo' | 'turnTimeout' | 'gameSettings' | 'ping' | 'pong';
  data: any;
}

export interface GameSettings {
  turnTimeLimit: number;
  gameMode: string;
  towerWarSettings?: {
    maxAttacks: number;
  };
  brainstormingSettings?: {
    targetScore: number;
    language: 'HU' | 'EN';
  };
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  component: any;
  initialState: () => any;
  gameLogic: any;
  settingsDisplay?: {
    [key: string]: {
      label: string;
      getValue: (settings: GameSettings) => string;
      icon?: string;
    };
  };
}