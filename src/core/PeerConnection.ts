import Peer from 'peerjs';
import type { GameMessage } from '../types/core';

export class PeerConnection {
  private peer: Peer | null = null;
  private connection: any = null;
  private isHost: boolean = false;
  private connected: boolean = false;
  private onMessage: ((message: GameMessage) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private heartbeatIntervalId: any = null;
  private heartbeatTimeoutId: any = null;
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly HEARTBEAT_TIMEOUT = 10000; // 10 seconds

  constructor() {}

  public createHost = (onMessage: (message: GameMessage) => void, onConnectionChange: (connected: boolean) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.onMessage = onMessage;
      this.onConnectionChange = onConnectionChange;
      
      try {
        const roomId = this.generateRoomId();
        
        this.peer = new Peer(roomId, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          secure: true,
          debug: 2
        });

        this.peer.on('open', (id) => {
          console.log('Host peer opened with ID:', id);
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          console.log('Incoming connection from:', conn.peer);
          this.connection = conn;
          this.setupConnection();
        });

        this.peer.on('error', (error) => {
          console.error('Peer error:', error);
          reject(error);
        });

        setTimeout(() => {
          if (!this.peer?.open) {
            reject(new Error('Connection timeout - please try again'));
          }
        }, 10000);

      } catch (error) {
        console.error('Error creating peer:', error);
        reject(error);
      }
    });
  };

  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public joinGame = (roomId: string, onMessage: (message: GameMessage) => void, onConnectionChange: (connected: boolean) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.onMessage = onMessage;
      this.onConnectionChange = onConnectionChange;

      try {
        const myId = 'player-' + Math.random().toString(36).substr(2, 9);
        
        this.peer = new Peer(myId, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          secure: true,
          debug: 2
        });

        this.peer.on('open', (id) => {
          console.log('Joiner peer opened with ID:', id);
          
          this.connection = this.peer!.connect(roomId.toUpperCase(), {
            reliable: true
          });
          
          this.setupConnection();
          
          this.connection.on('open', () => {
            console.log('Connected to host');
            resolve();
          });
        });

        this.peer.on('error', (error) => {
          console.error('Peer error:', error);
          reject(error);
        });

        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout - please check the room code'));
          }
        }, 15000);

      } catch (error) {
        reject(new Error('Failed to join room: ' + error.message));
      }
    });
  };

  private setupConnection(): void {
    if (!this.connection) return;

    this.connection.on('open', () => {
      console.log('Connection established');
      this.connected = true;
      this.onConnectionChange?.(true);
      
      // Start heartbeat mechanism
      this.startHeartbeat();
      
      if (!this.isHost) {
        console.log('Joiner sending playerJoined message');
        this.sendMessage({ type: 'playerJoined', data: {} });
      }
    });

    this.connection.on('data', (data: any) => {
      try {
        console.log('Peer received data:', data.type, data.data);
        
        // Handle heartbeat messages internally
        if (data.type === 'ping') {
          console.log('Received ping, sending pong');
          this.sendMessage({ type: 'pong', data: {} });
          this.resetHeartbeatTimeout();
        } else if (data.type === 'pong') {
          console.log('Received pong');
          this.resetHeartbeatTimeout();
        } else {
          // Reset heartbeat timeout for any message
          this.resetHeartbeatTimeout();
          // Forward non-heartbeat messages
          this.onMessage?.(data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.connection.on('close', () => {
      console.log('Connection closed');
      this.connected = false;
      this.onConnectionChange?.(false);
    });

    this.connection.on('error', (error: any) => {
      console.error('Connection error:', error);
      this.connected = false;
      this.onConnectionChange?.(false);
      this.stopHeartbeat();
    });
  }

  private startHeartbeat(): void {
    console.log('Starting heartbeat mechanism');
    
    // Clear any existing heartbeat timers
    this.stopHeartbeat();
    
    // Start sending ping messages regularly
    this.heartbeatIntervalId = setInterval(() => {
      if (this.connected && this.connection) {
        console.log('Sending heartbeat ping');
        this.sendMessage({ type: 'ping', data: {} });
      }
    }, this.HEARTBEAT_INTERVAL);
    
    // Set initial timeout
    this.resetHeartbeatTimeout();
  }

  private resetHeartbeatTimeout(): void {
    // Clear existing timeout
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
    }
    
    // Set new timeout
    this.heartbeatTimeoutId = setTimeout(() => {
      this.handleHeartbeatTimeout();
    }, this.HEARTBEAT_TIMEOUT);
  }

  private handleHeartbeatTimeout(): void {
    console.log('Heartbeat timeout - connection appears to be lost');
    this.connected = false;
    this.onConnectionChange?.(false);
    this.disconnect();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  public sendMessage = (message: GameMessage): void => {
    if (this.connection && this.connected) {
      try {
        console.log('Peer sending message:', message.type, message.data);
        this.connection.send(message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.warn('Cannot send message - not connected:', message.type);
    }
  };

  public isConnected = (): boolean => {
    return this.connected;
  };

  public isHostPlayer = (): boolean => {
    return this.isHost;
  };

  public disconnect = (): void => {
    console.log('Disconnecting peer connection');
    
    // Stop heartbeat mechanism
    this.stopHeartbeat();
    
    if (this.connection) {
      try {
        this.connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
      this.connection = null;
    }
    
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (error) {
        console.error('Error destroying peer:', error);
      }
      this.peer = null;
    }
    
    this.connected = false;
  };
}