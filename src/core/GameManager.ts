import type { GameMessage, PlayerInfo, Player, GameSettings } from '../types/core';
import { PeerConnection } from './PeerConnection';
import { sanitizePlayerName } from '../utils/sanitizer';

export class GameManager {
  private peer: PeerConnection | null = null;
  private isHost: boolean = false;
  private myColor: Player = 'red';
  private roomCode: string = '';
  private connecting: boolean = false;
  private connected: boolean = false;
  private gameStarted: boolean = false;
  private errorMessage: string = '';
  private inPreLobby: boolean = false;
  private myPlayerInfo: PlayerInfo = { id: '', name: '', color: 'red' };
  private opponentInfo: PlayerInfo | null = null;
  private gameSettings: GameSettings = { turnTimeLimit: 0, gameMode: 'color-duel' };

  // Callbacks
  private onStateChange: (() => void) | null = null;
  private onMessage: ((message: GameMessage) => void) | null = null;

  constructor(onStateChange: () => void, onMessage: (message: GameMessage) => void) {
    this.peer = new PeerConnection();
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
  }

  // Getters for state
  getIsHost(): boolean { return this.isHost; }
  getMyColor(): Player { return this.myColor; }
  getRoomCode(): string { return this.roomCode; }
  getConnecting(): boolean { return this.connecting; }
  getConnected(): boolean { return this.connected; }
  getGameStarted(): boolean { return this.gameStarted; }
  getErrorMessage(): string { return this.errorMessage; }
  getInPreLobby(): boolean { return this.inPreLobby; }
  getMyPlayerInfo(): PlayerInfo { return this.myPlayerInfo; }
  getOpponentInfo(): PlayerInfo | null { return this.opponentInfo; }
  getGameSettings(): GameSettings { return this.gameSettings; }

  setPlayerName(name: string): void {
    // Sanitize and validate the player name
    const sanitizedName = sanitizePlayerName(name, 12);
    this.myPlayerInfo.name = sanitizedName;
    this.myPlayerInfo = { ...this.myPlayerInfo };
    
    if (this.connected && this.peer && this.inPreLobby) {
      this.peer.sendMessage({
        type: 'playerInfo',
        data: this.myPlayerInfo
      });
    }
    this.onStateChange?.();
  }

  setGameSettings(settings: Partial<GameSettings>): void {
    this.gameSettings = { ...this.gameSettings, ...settings };
    console.log('GameManager: setGameSettings called with:', settings);
    console.log('GameManager: Current gameSettings after update:', this.gameSettings);
    this.onStateChange?.();
  }

  async createRoom(): Promise<void> {
    if (!this.peer) return;
    
    this.errorMessage = '';
    this.connecting = true;
    this.onStateChange?.();
    
    try {
      this.roomCode = await this.peer.createHost(
        this.handleMessage.bind(this), 
        this.handleConnectionChange.bind(this)
      );
      this.isHost = true;
      this.myColor = 'red';
      this.myPlayerInfo = { ...this.myPlayerInfo, id: 'host', color: 'red' };
    } catch (error) {
      console.error('Error creating room:', error);
      this.errorMessage = 'Failed to create room: ' + (error.message || 'Unknown error');
    } finally {
      this.connecting = false;
      this.onStateChange?.();
    }
  }

  async joinRoom(code: string): Promise<void> {
    if (!this.peer) return;
    
    this.errorMessage = '';
    this.connecting = true;
    this.onStateChange?.();
    
    try {
      await this.peer.joinGame(
        code, 
        this.handleMessage.bind(this), 
        this.handleConnectionChange.bind(this)
      );
      this.isHost = false;
      this.myColor = 'blue';
      this.myPlayerInfo = { ...this.myPlayerInfo, id: 'joiner', color: 'blue' };
    } catch (error) {
      console.error('Error joining room:', error);
      this.errorMessage = 'Failed to join room: ' + (error.message || 'Unknown error');
    } finally {
      this.connecting = false;
      this.onStateChange?.();
    }
  }

  startGame(): void {
    if (!this.peer || !this.connected || !this.isHost) return;
    
    console.log('GameManager: startGame called with settings:', this.gameSettings);
    
    this.gameStarted = true;
    this.inPreLobby = false;
    
    // Initialize game state for host immediately
    this.onMessage?.({
      type: 'startGame',
      data: {
        gameSettings: this.gameSettings
      }
    });
    
    // Send start game signal
    this.peer.sendMessage({
      type: 'startGame',
      data: {
        gameSettings: this.gameSettings
      }
    });
    
    console.log('GameManager: Sent startGame message with settings:', this.gameSettings);
    this.onStateChange?.();
  }

  kickPlayer(): void {
    if (!this.peer || !this.isHost) return;
    
    this.peer.sendMessage({
      type: 'kickPlayer',
      data: {}
    });
    
    this.handleConnectionChange(false);
  }

  sendMessage(message: GameMessage): void {
    if (this.peer && this.connected) {
      this.peer.sendMessage(message);
    }
  }

  private handleConnectionChange(isConnected: boolean): void {
    this.connected = isConnected;
    console.log('GameManager: handleConnectionChange called with:', isConnected, 'isHost:', this.isHost);
    if (!isConnected) {
      this.gameStarted = false;
      this.inPreLobby = false;
      this.opponentInfo = null;
    } else if (isConnected && !this.isHost) {
      this.inPreLobby = true;
    } else if (isConnected && this.isHost) {
      this.inPreLobby = true;
      console.log('GameManager: Host sending gameSettings to peer:', this.gameSettings);
      setTimeout(() => {
        if (this.peer) {
          console.log('GameManager: Host sent gameSettings:', this.gameSettings);
          this.peer.sendMessage({
            type: 'requestPlayerInfo',
            data: {}
          });
        }
      }, 200);
    }
    this.onStateChange?.();
  }

  private handleMessage(message: GameMessage): void {
    console.log('GameManager: handleMessage called with:', message.type, message.data);
    switch (message.type) {
      case 'playerJoined':
        if (this.isHost) {
          this.inPreLobby = true;
          setTimeout(() => {
            if (this.peer) {
              this.peer.sendMessage({
                type: 'playerInfo',
                data: this.myPlayerInfo
              });
              this.peer.sendMessage({
                type: 'gameSettings',
                data: this.gameSettings
              });
              this.peer.sendMessage({
                type: 'requestPlayerInfo',
                data: {}
              });
            }
          }, 100);
        }
        break;
      case 'playerInfo':
        // Sanitize opponent's name when receiving player info
        const sanitizedOpponentInfo = {
          ...message.data,
          name: sanitizePlayerName(message.data.name || '', 12)
        };
        this.opponentInfo = sanitizedOpponentInfo;
        this.opponentInfo = { ...this.opponentInfo };
        break;
      case 'requestPlayerInfo':
        if (this.peer) {
          this.peer.sendMessage({
            type: 'playerInfo',
            data: this.myPlayerInfo
          });
        }
        break;
      case 'gameSettings':
        this.gameSettings = { ...message.data };
        console.log('GameManager: Received gameSettings, updated to:', this.gameSettings);
        break;
      case 'startGame':
        console.log('GameManager: Received startGame message');
        this.gameStarted = true;
        this.inPreLobby = false;
        // Forward the startGame message to App.svelte so it can initialize gameState
        this.onMessage?.(message);
        break;
      case 'kickPlayer':
        if (!this.isHost) {
          this.handleConnectionChange(false);
          this.errorMessage = 'You were removed from the game';
        }
        break;
      default:
        // Forward game-specific messages
        this.onMessage?.(message);
        break;
    }
    this.onStateChange?.();
  }

  disconnect(): void {
    if (this.peer) {
      this.peer.disconnect();
    }
  }
}