# Color Duel P2P Game

A real-time multiplayer game platform built with Svelte, TypeScript, and PeerJS. Features multiple game modes including Color Duel (strategic tic-tac-toe) and Tower War (tower building strategy game).

## 🎮 Game Modes

### Color Duel
- **Objective**: Get 3 colors in a row on a 3x3 grid
- **Special Mechanic**: Each player can steal one opponent cell per game
- **Strategy**: Balance offense and defense while timing your steal ability

### Tower War
- **Objective**: Build your tower to 10 levels OR destroy opponent's tower
- **Actions**: Build (+1 level), Attack (-1 enemy level), Defend (block next attack)
- **Limits**: Need 3+ levels to attack, max 10 attacks per game

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (recommended: latest LTS)
- **npm** or **yarn** package manager
- Modern web browser with WebRTC support

### Installation & Setup

#### Option 1: Fork the Repository
1. Fork this repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/color-duel-p2p-game.git
   cd color-duel-p2p-game
   ```

#### Option 2: Download Repository
1. Download the repository as ZIP
2. Extract to your desired location
3. Navigate to the project directory

#### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
```

The development server will start at `http://localhost:5173`

## 🏗️ Project Architecture

### Core Structure
```
src/
├── components/          # Svelte components
│   ├── Lobby.svelte    # Main lobby for creating/joining games
│   └── PreLobby.svelte # Pre-game lobby with player info
├── core/               # Core game management
│   ├── GameManager.ts  # Main game state management
│   └── PeerConnection.ts # WebRTC peer-to-peer connection
├── gameModes/          # Game mode implementations
│   ├── index.ts        # Game mode registry
│   ├── colorDuel/      # Color Duel game mode
│   └── towerWar/       # Tower War game mode
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── main.ts            # Application entry point
```

### Key Components

#### GameManager (`src/core/GameManager.ts`)
- **Purpose**: Central state management for the entire game
- **Responsibilities**:
  - Player management (names, colors, info)
  - Room creation and joining
  - Game settings management
  - Message routing between components
  - Connection state management

#### PeerConnection (`src/core/PeerConnection.ts`)
- **Purpose**: WebRTC peer-to-peer communication
- **Responsibilities**:
  - Creating and joining rooms via PeerJS
  - Real-time message transmission
  - Connection lifecycle management
  - Error handling and reconnection

#### Game Mode System (`src/gameModes/`)
- **Purpose**: Modular game implementations
- **Structure**: Each game mode contains:
  - `*Board.svelte`: UI component for the game
  - `*Logic.ts`: Game rules and state management
  - Type definitions in `src/types/`

## 🎯 Adding New Game Modes

### Step 1: Create Type Definitions
Create `src/types/yourGameMode.ts`:

```typescript
import type { BaseGameState, Player } from './core';

// Define your game-specific state
export interface YourGameState extends BaseGameState {
  // Add your game-specific properties
  customProperty: any;
}

// Define move data structure
export interface YourMoveData {
  action: string;
  player: Player;
  // Add other move-specific data
}

// Export initial state
export const initialYourGameState: YourGameState = {
  // Initialize your game state
  customProperty: defaultValue,
  // Required base properties
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};
```

### Step 2: Implement Game Logic
Create `src/gameModes/yourGameMode/YourGameLogic.ts`:

```typescript
import type { YourGameState, YourMoveData } from '../../types/yourGameMode';
import type { GameSettings } from '../../types/core';

// Check if a player has won
export function checkWinner(gameState: YourGameState): Player | null {
  // Implement win condition logic
  return null;
}

// Validate if a move is legal
export function canMakeMove(gameState: YourGameState, moveData: any, player: Player): boolean {
  // Implement move validation
  return true;
}

// Execute a move and return new state
export function makeMove(gameState: YourGameState, moveData: any, player: Player): YourGameState {
  // Implement move execution
  const newState = { ...gameState };
  // Update game state based on move
  return newState;
}

// Initialize game state
export function resetGame(gameSettings: GameSettings): YourGameState {
  // Return initial game state with settings applied
  return {
    ...initialYourGameState,
    turnTimeLimit: gameSettings.turnTimeLimit,
    gameStarted: true,
  };
}

// Handle turn timeout
export function skipTurn(gameState: YourGameState): YourGameState {
  const newState = { ...gameState };
  // Switch turns and update timing
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = Date.now();
  newState.timeRemaining = gameState.turnTimeLimit;
  return newState;
}
```

### Step 3: Create UI Component
Create `src/gameModes/yourGameMode/YourGameBoard.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { YourGameState } from '../../types/yourGameMode';
  import type { PlayerInfo, GameSettings } from '../../types/core';
  import { canMakeMove } from './YourGameLogic';

  export let gameState: YourGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  function handleMove(moveData: any) {
    if (canMakeMove(gameState, moveData, myColor)) {
      dispatch('move', moveData);
    }
  }

  function handleReset() {
    dispatch('reset');
  }
</script>

<!-- Your game UI here -->
<div class="game-container">
  <!-- Implement your game interface -->
</div>

<style>
  /* Your game styles */
</style>
```

### Step 4: Register the Game Mode
Update `src/gameModes/index.ts`:

```typescript
import YourGameBoard from './yourGameMode/YourGameBoard.svelte';
import * as YourGameLogic from './yourGameMode/YourGameLogic';
import { initialYourGameState } from '../types/yourGameMode';

export const gameModes: GameMode[] = [
  // ... existing game modes
  {
    id: 'your-game-mode',
    name: 'Your Game Name',
    description: 'Brief description of your game',
    component: YourGameBoard,
    initialState: () => ({ ...initialYourGameState }),
    gameLogic: YourGameLogic
  }
];
```

## ⚙️ Adding Game Settings

### Step 1: Extend GameSettings Type
Update `src/types/core.ts`:

```typescript
export interface GameSettings {
  turnTimeLimit: number;
  gameMode: string;
  // Add your new settings
  yourGameSettings?: {
    customSetting: number;
    anotherSetting: boolean;
  };
}
```

### Step 2: Add UI Controls
Update `src/components/Lobby.svelte` to add setting controls:

```svelte
<!-- Add in the game mode settings section -->
{#if selectedGameMode === 'your-game-mode'}
  <div class="your-game-setting">
    <label for="customSetting">Custom Setting:</label>
    <input 
      id="customSetting"
      type="number" 
      bind:value={customSettingValue}
      min="1"
      max="100"
      class="timer-input"
    />
  </div>
{/if}
```

### Step 3: Apply Settings in Game Logic
Use the settings in your `resetGame` function:

```typescript
export function resetGame(gameSettings: GameSettings): YourGameState {
  const customValue = gameSettings.yourGameSettings?.customSetting ?? 10;
  
  return {
    ...initialYourGameState,
    customProperty: customValue,
    turnTimeLimit: gameSettings.turnTimeLimit,
    gameStarted: true,
  };
}
```

## 🔧 Development Guidelines

### Code Organization
- **Single Responsibility**: Each file should have one clear purpose
- **Type Safety**: Use TypeScript for all new code
- **Reactive Programming**: Leverage Svelte's reactivity system
- **Modular Design**: Keep game modes independent and reusable

### State Management
- **Immutable Updates**: Always create new state objects
- **Centralized Logic**: Keep game rules in `*Logic.ts` files
- **Event-Driven**: Use Svelte's event system for component communication

### Styling Guidelines
- **Responsive Design**: Support mobile and desktop
- **Consistent Theming**: Use CSS custom properties for colors
- **Smooth Animations**: Add transitions for better UX
- **Accessibility**: Ensure proper contrast and keyboard navigation

### Testing Your Game Mode
1. **Local Testing**: Use two browser windows/tabs
2. **Network Testing**: Test with different devices on same network
3. **Edge Cases**: Test connection drops, timeouts, invalid moves
4. **Mobile Testing**: Verify touch interactions work properly

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: Any static file hosting service
- **Self-Hosted**: Apache, Nginx, or any web server

### Environment Considerations
- **HTTPS Required**: WebRTC requires secure connections in production
- **STUN/TURN Servers**: May need configuration for restrictive networks
- **Browser Compatibility**: Ensure WebRTC support in target browsers

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
- **Firewall/NAT**: Some networks block WebRTC
- **Browser Compatibility**: Ensure WebRTC support
- **HTTPS**: Required for production deployments

#### Game State Issues
- **State Synchronization**: Check message handling in GameManager
- **Move Validation**: Verify `canMakeMove` logic
- **Turn Management**: Ensure proper turn switching

#### Development Issues
- **TypeScript Errors**: Run `npm run check` for type checking
- **Build Failures**: Check for missing dependencies
- **Hot Reload**: Restart dev server if changes aren't reflected

### Debug Tools
- **Browser DevTools**: Network tab for WebRTC connections
- **Console Logging**: Extensive logging throughout the codebase
- **Svelte DevTools**: Browser extension for component inspection

## 📝 Contributing

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Update documentation
6. Submit pull request

### Code Style
- Use Prettier for formatting
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Keep functions small and focused

## 📄 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## 🤝 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the code examples in this README

---

**Happy coding! 🎮**