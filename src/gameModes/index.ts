import type { GameMode } from '../types/core';
import ColorDuelBoard from './colorDuel/ColorDuelBoard.svelte';
import TowerWarBoard from './towerWar/TowerWarBoard.svelte';
import ShadowCodeBoard from './shadowCode/ShadowCodeBoard.svelte';
import * as ColorDuelLogic from './colorDuel/ColorDuelLogic';
import * as TowerWarLogic from './towerWar/TowerWarLogic';
import * as ShadowCodeLogic from './shadowCode/ShadowCodeLogic';
import { initialColorDuelGameState } from '../types/colorDuel';
import { initialTowerWarGameState } from '../types/towerWar';
import { initialShadowCodeGameState } from '../types/shadowCode';

export const gameModes: GameMode[] = [
  {
    id: 'color-duel',
    name: 'Color Duel',
    description: 'Classic 3x3 grid battle with steal mechanic',
    component: ColorDuelBoard,
    initialState: () => ({ ...initialColorDuelGameState }),
    gameLogic: ColorDuelLogic,
    settingsDisplay: {
      turnTimer: {
        label: 'Turn Timer',
        getValue: (settings) => settings.turnTimeLimit === 0 ? 'Unlimited' : `${settings.turnTimeLimit}s`,
        icon: '⏱️'
      }
    }
  },
  {
    id: 'tower-war',
    name: 'Tower War',
    description: 'Build your tower to 10 levels while sabotaging your opponent',
    component: TowerWarBoard,
    initialState: () => ({ ...initialTowerWarGameState }),
    gameLogic: TowerWarLogic,
    settingsDisplay: {
      turnTimer: {
        label: 'Turn Timer',
        getValue: (settings) => settings.turnTimeLimit === 0 ? 'Unlimited' : `${settings.turnTimeLimit}s`,
        icon: '⏱️'
      },
      maxAttacks: {
        label: 'Max Attacks',
        getValue: (settings) => `${settings.towerWarSettings?.maxAttacks ?? 10} per player`,
        icon: '💥'
      }
    }
  },
  {
    id: 'shadow-code',
    name: 'Shadow Code',
    description: 'Crack your opponent\'s 3-digit secret code before they crack yours',
    component: ShadowCodeBoard,
    initialState: () => ({ ...initialShadowCodeGameState }),
    gameLogic: ShadowCodeLogic,
    settingsDisplay: {
      turnTimer: {
        label: 'Turn Timer',
        getValue: (settings) => settings.turnTimeLimit === 0 ? 'Unlimited' : `${settings.turnTimeLimit}s`,
        icon: '⏱️'
      }
    }
  }
];

export function getGameMode(id: string): GameMode | undefined {
  return gameModes.find(mode => mode.id === id);
}