# Shadow Games - P2P Multiplayer Platform

A real-time multiplayer game platform built with Svelte, TypeScript, and PeerJS. Features multiple strategic game modes with peer-to-peer connectivity, no central server required.

## 🎮 Game Modes

### Color Duel
- **Objective**: Get 3 colors in a row on a 3x3 grid
- **Special Mechanic**: Each player can steal one opponent cell per game
- **Strategy**: Balance offense and defense while timing your steal ability
- **Turn Mode**: Sequential (traditional turn-based)

### Tower War
- **Objective**: Build your tower to 10 levels OR destroy opponent's tower
- **Actions**: Build (+1 level), Attack (-1 enemy level), Defend (block next attack)
- **Limits**: Need 3+ levels to attack, configurable max attacks per game
- **Turn Mode**: Sequential (traditional turn-based)

### Shadow Code
- **Objective**: Crack your opponent's secret 3-digit code before they crack yours
- **Gameplay**: Take turns making guesses and receive feedback clues
- **Feedback**: Exact matches (🔵), partial matches (🟡), no matches (❌)
- **Turn Mode**: Sequential (traditional turn-based)

### Brainstorming
- **Objective**: Test your knowledge in a fast-paced quiz battle
- **Languages**: Hungarian 🇭🇺 and English 🇬🇧 questions available
- **Question Types**: Multiple choice and number input questions
- **Scoring**: Points for correct answers, bonus for exact number matches
- **Turn Mode**: Simultaneous (both players answer at the same time)

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
   git clone https://github.com/YOUR_USERNAME/shadow-games-p2p.git
   cd shadow-games-p2p
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
├── config/             # Configuration files
│   └── debug.ts        # Debug logging system
├── core/               # Core game management
│   ├── GameManager.ts  # Main game state management
│   ├── PeerConnection.ts # WebRTC peer-to-peer connection
│   └── TurnManager.ts  # Turn management system
├── gameModes/          # Game mode implementations
│   ├── index.ts        # Game mode registry
│   ├── colorDuel/      # Color Duel game mode
│   ├── towerWar/       # Tower War game mode
│   ├── shadowCode/     # Shadow Code game mode
│   └── brainstorming/  # Brainstorming quiz game mode
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── sanitizer.ts    # Input sanitization
│   └── storage.ts      # localStorage utilities
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
  - **Player name persistence**: Automatically saves and loads player names

#### PeerConnection (`src/core/PeerConnection.ts`)
- **Purpose**: WebRTC peer-to-peer communication with enhanced reliability
- **Features**:
  - Creating and joining rooms via PeerJS
  - Real-time message transmission
  - **Heartbeat system** for connection monitoring
  - Automatic reconnection detection
  - Error handling and connection lifecycle management

#### TurnManager (`src/core/TurnManager.ts`)
- **Purpose**: Flexible turn management system supporting multiple turn modes
- **Turn Modes**:
  - **Sequential**: Traditional turn-based gameplay (Color Duel, Tower War, Shadow Code)
  - **Simultaneous**: Both players act at the same time (Brainstorming)
- **Features**:
  - Automatic turn switching
  - Timeout handling
  - Player action validation
  - Waiting state management for simultaneous modes

#### Game Mode System (`src/gameModes/`)
- **Purpose**: Modular game implementations
- **Structure**: Each game mode contains:
  - `*Board.svelte`: UI component for the game
  - `*Logic.ts`: Game rules and state management
  - Type definitions in `src/types/`
  - Turn mode specification

## 🔧 New Developer Features

### Player Name Persistence
The application now automatically saves and loads player names using localStorage:

```typescript
import { savePlayerName, loadPlayerName, clearPlayerName } from '../utils/storage';

// Save player name (automatically called when name is set)
savePlayerName('PlayerName');

// Load saved name (automatically called on app start)
const savedName = loadPlayerName();

// Clear saved name
clearPlayerName();
```

**Features:**
- **Automatic saving**: Names are saved as the user types
- **Persistent across sessions**: Names are remembered between browser sessions
- **Cross-tab synchronization**: Changes in one tab affect others
- **Graceful fallback**: Works even if localStorage is unavailable

### Turn Management System
A flexible system that supports different turn modes:

#### Sequential Mode (Traditional)
Used by Color Duel, Tower War, and Shadow Code:
```typescript
// Players take turns one after another
// Only the current player can make moves
// Turn automatically switches after each action
```

#### Simultaneous Mode
Used by Brainstorming:
```typescript
// Both players can act at the same time
// Game waits for both players to submit actions
// Automatic synchronization and feedback phases
```

#### Implementation Example
```typescript
// In game logic
export function makeMove(gameState: GameState, moveData: any, player: Player): GameState {
  return TurnManager.handlePlayerAction(gameState, player, (state) => {
    // Your game-specific logic here
    const newState = { ...state };
    // Apply the move
    return newState;
  });
}
```

### Debug System (`src/config/debug.ts`)
A centralized debug logging system that can be toggled globally:

```typescript
import { debugLog, debugError, debugWarn } from '../config/debug';

// Usage throughout the codebase
debugLog('Game state updated:', gameState);
debugError('Connection failed:', error);
debugWarn('Invalid move attempted:', moveData);
```

**Configuration:**
- Set `DEBUG_MODE = true` in `src/config/debug.ts` for development
- Set `DEBUG_MODE = false` for production builds
- All console.log statements replaced with debug functions

### Heartbeat Connection System
Enhanced peer-to-peer reliability with automatic connection monitoring:

- **Ping/Pong mechanism**: Regular heartbeat messages every 5 seconds
- **Timeout detection**: 10-second timeout for connection loss detection
- **Automatic cleanup**: Proper resource cleanup on disconnection
- **Graceful handling**: Distinguishes between intentional and accidental disconnects

### Game Settings System
Flexible configuration system for game modes with automatic UI generation:

```typescript
// In game mode definition
settingsDisplay: {
  turnTimer: {
    label: 'Turn Timer',
    getValue: (settings) => settings.turnTimeLimit === 0 ? 'Unlimited' : `${settings.turnTimeLimit}s`,
    icon: '⏱️'
  },
  targetScore: {
    label: 'Target Score',
    getValue: (settings) => `${settings.brainstormingSettings?.targetScore ?? 10} points to win`,
    icon: '🎯'
  }
}
```

**Features:**
- **Optional display**: Settings only show if defined in game mode
- **Custom icons**: Each setting can have an emoji icon
- **Dynamic values**: Settings display computed values based on current configuration
- **Automatic UI**: PreLobby automatically renders all defined settings

## 🧠 Brainstorming Game Mode

### Question Management
The Brainstorming mode includes a comprehensive question system:

#### Adding New Questions
Edit `src/gameModes/brainstorming/questions.ts`:

```typescript
// Hungarian Questions
const hungarianQuestions: Question[] = [
  {
    id: 'hu-new',
    text: 'Your question in Hungarian?',
    type: 'select', // or 'number'
    language: 'HU',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], // for select type
    correctAnswer: 'Option 1', // or number for number type
    exactPoints: 1, // points for correct answer
    closePoints: 1 // optional: points for close answer (number type only)
  }
];

// English Questions
const englishQuestions: Question[] = [
  {
    id: 'en-new',
    text: 'Your question in English?',
    type: 'number',
    language: 'EN',
    correctAnswer: 42,
    exactPoints: 2,
    closePoints: 1 // within 10% tolerance
  }
];
```

#### Question Types
1. **Multiple Choice (`select`)**:
   - 4 options provided
   - 1 point for correct answer
   - 0 points for wrong answer

2. **Number Input (`number`)**:
   - Exact answer gets full points
   - Close answer (within 10% tolerance) gets partial points
   - Wrong answer gets 0 points

#### Question Randomization
- **Session-based seed**: Questions are shuffled consistently for both players
- **Hourly rotation**: Question order changes every hour but remains consistent during play
- **Language-specific**: Each language has its own question pool

#### Modifying Existing Questions
1. Find the question by its `id` in the questions array
2. Update any properties (text, options, correctAnswer, points)
3. Ensure both Hungarian and English versions are updated if applicable

#### Deleting Questions
1. Remove the question object from the appropriate array
2. Ensure the `id` is not referenced elsewhere
3. Test that the game still works with the reduced question pool

### Game Settings
- **Target Score**: Set to 0 for "play all questions" mode, or any number for "first to X points"
- **Language**: Choose between Hungarian (HU) and English (EN)
- **Turn Timer**: Optional time limit per question

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
  turnState: undefined, // Will be initialized by TurnManager
};
```

### Step 2: Implement Game Logic
Create `src/gameModes/yourGameMode/YourGameLogic.ts`:

```typescript
import { debugLog } from '../../config/debug';
import { TurnManager } from '../../core/TurnManager';
import type { YourGameState, YourMoveData } from '../../types/yourGameMode';
import type { GameSettings } from '../../types/core';

// Check if a player has won
export function checkWinner(gameState: YourGameState): Player | null {
  // Implement win condition logic
  return null;
}

// Validate if a move is legal
export function canMakeMove(gameState: YourGameState, moveData: any, player: Player): boolean {
  debugLog('YourGame canMakeMove:', { moveData, player, gameState });
  
  // Use TurnManager for turn validation
  if (!TurnManager.canPlayerAct(gameState, player)) {
    return false;
  }
  
  // Implement game-specific move validation
  return true;
}

// Execute a move and return new state
export function makeMove(gameState: YourGameState, moveData: any, player: Player): YourGameState {
  debugLog('YourGame makeMove:', { moveData, player });
  
  // Use TurnManager to handle the move
  return TurnManager.handlePlayerAction(gameState, player, (state) => {
    // Implement your game-specific logic here
    const newState = { ...state };
    // Update game state based on move
    newState.winner = checkWinner(newState);
    return newState;
  });
}

// Initialize game state
export function resetGame(gameSettings: GameSettings): YourGameState {
  // Determine turn mode for your game
  const turnMode = 'sequential'; // or 'simultaneous'
  
  return {
    ...initialYourGameState,
    turnTimeLimit: gameSettings.turnTimeLimit,
    gameStarted: true,
    turnState: TurnManager.initializeTurnState(turnMode),
  };
}

// Handle turn timeout
export function skipTurn(gameState: YourGameState): YourGameState {
  return TurnManager.handleTurnTimeout(gameState, (state) => {
    // Handle timeout-specific logic (e.g., skip player's turn)
    const newState = { ...state };
    // Your timeout handling logic here
    return newState;
  });
}
```

### Step 3: Create UI Component
Create `src/gameModes/yourGameMode/YourGameBoard.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
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
      debugLog('YourGame dispatching move:', moveData);
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
    gameLogic: YourGameLogic,
    turnMode: 'sequential', // or 'simultaneous'
    settingsDisplay: {
      // Optional: Define settings that should appear in UI
      customSetting: {
        label: 'Custom Setting',
        getValue: (settings) => `${settings.yourCustomValue}`,
        icon: '⚙️'
      }
    }
  }
];
```

## 🔄 Turn Management Patterns

### Sequential Turn Pattern (Traditional)
Perfect for games where players alternate moves:

```typescript
// Example: Color Duel, Tower War, Shadow Code
export function makeMove(gameState: GameState, moveData: any, player: Player): GameState {
  return TurnManager.handlePlayerAction(gameState, player, (state) => {
    // Apply the move
    const newState = { ...state };
    newState.board[moveData.x][moveData.y] = player;
    
    // Check for winner
    newState.winner = checkWinner(newState);
    
    return newState;
    // TurnManager automatically switches turns
  });
}
```

### Simultaneous Turn Pattern
Perfect for games where both players act at the same time:

```typescript
// Example: Brainstorming quiz
export function makeMove(gameState: GameState, moveData: any, player: Player): GameState {
  return TurnManager.handlePlayerAction(gameState, player, (state) => {
    // Record player's action
    const newState = { ...state };
    newState.playerAnswers[player] = moveData.answer;
    
    // Check if both players have acted
    const bothActed = newState.playerAnswers.red && newState.playerAnswers.blue;
    
    if (bothActed) {
      // Process both actions together
      newState.showingResults = true;
      // TurnManager will reset for next round
    }
    
    return newState;
  });
}
```

### Mixed Pattern (Setup + Gameplay)
For games with different phases:

```typescript
// Example: Shadow Code (setup phase is simultaneous, guessing is sequential)
export function makeMove(gameState: GameState, moveData: any, player: Player): GameState {
  if (moveData.type === 'setCode') {
    // Setup phase - simultaneous
    return TurnManager.handlePlayerAction(gameState, player, (state) => {
      const newState = { ...state };
      newState.playerCodes[player] = moveData.code;
      
      // Switch to sequential mode when both codes are set
      if (newState.playerCodes.red && newState.playerCodes.blue) {
        newState.turnState.mode = 'sequential';
        newState.gameStarted = true;
      }
      
      return newState;
    });
  } else {
    // Guessing phase - sequential
    return TurnManager.handlePlayerAction(gameState, player, (state) => {
      // Handle guess logic
      return state;
    });
  }
}
```

## ⚙️ Game Settings Configuration

### Adding Custom Settings

#### Step 1: Extend GameSettings Type
Update `src/types/core.ts`:

```typescript
export interface GameSettings {
  turnTimeLimit: number;
  gameMode: string;
  turnMode?: TurnMode;
  // Add your new settings
  yourGameSettings?: {
    customSetting: number;
    anotherSetting: boolean;
  };
}
```

#### Step 2: Add UI Controls
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

#### Step 3: Configure Settings Display
Add to your game mode definition:

```typescript
settingsDisplay: {
  customSetting: {
    label: 'Custom Setting',
    getValue: (settings) => `${settings.yourGameSettings?.customSetting ?? 10}`,
    icon: '⚙️'
  }
}
```

The settings will automatically appear in the PreLobby component with the specified label, icon, and computed value.

## 🔧 Development Guidelines

### Code Organization
- **Single Responsibility**: Each file should have one clear purpose
- **Type Safety**: Use TypeScript for all new code
- **Reactive Programming**: Leverage Svelte's reactivity system
- **Modular Design**: Keep game modes independent and reusable

### Debug Logging
- **Use debug functions**: Replace all `console.log` with `debugLog`, `debugError`, or `debugWarn`
- **Meaningful messages**: Include context and relevant data in debug messages
- **Production ready**: Set `DEBUG_MODE = false` for production builds

### State Management
- **Immutable Updates**: Always create new state objects
- **Centralized Logic**: Keep game rules in `*Logic.ts` files
- **Event-Driven**: Use Svelte's event system for component communication
- **Turn Management**: Use TurnManager for consistent turn handling

### Connection Handling
- **Heartbeat awareness**: The system automatically handles connection monitoring
- **Graceful degradation**: Handle connection loss scenarios appropriately
- **Error boundaries**: Wrap connection operations in try-catch blocks

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
5. **Debug Mode**: Enable debug logging during development
6. **Turn Management**: Test both sequential and simultaneous modes if applicable

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
- **Debug Mode**: Ensure `DEBUG_MODE = false` in production

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
- **Firewall/NAT**: Some networks block WebRTC
- **Browser Compatibility**: Ensure WebRTC support
- **HTTPS**: Required for production deployments
- **Heartbeat timeout**: Check network stability

#### Game State Issues
- **State Synchronization**: Check message handling in GameManager
- **Move Validation**: Verify `canMakeMove` logic
- **Turn Management**: Ensure proper turn switching with TurnManager
- **Simultaneous Mode**: Check that both players' actions are properly synchronized

#### Development Issues
- **TypeScript Errors**: Run `npm run check` for type checking
- **Build Failures**: Check for missing dependencies
- **Hot Reload**: Restart dev server if changes aren't reflected
- **Debug Output**: Toggle `DEBUG_MODE` for troubleshooting

### Debug Tools
- **Browser DevTools**: Network tab for WebRTC connections
- **Debug Logging**: Extensive logging throughout the codebase (when enabled)
- **Svelte DevTools**: Browser extension for component inspection
- **Connection Monitor**: Built-in heartbeat system for connection status
- **Turn Manager**: Built-in logging for turn state changes

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
- Use debug logging instead of console.log
- Follow turn management patterns for consistency

## 📄 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## 🤝 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the code examples in this README

---

**Happy coding! 🎮**