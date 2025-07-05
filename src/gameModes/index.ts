import type { GameMode } from '../types/core';
import ColorDuelBoard from './colorDuel/ColorDuelBoard.svelte';
import TowerWarBoard from './towerWar/TowerWarBoard.svelte';
import CountryWarBoard from './countryWar/CountryWarBoard.svelte';
import * as ColorDuelLogic from './colorDuel/ColorDuelLogic';
import * as TowerWarLogic from './towerWar/TowerWarLogic';
import * as CountryWarLogic from './countryWar/CountryWarLogic';
import { initialColorDuelGameState } from '../types/colorDuel';
import { initialTowerWarGameState } from '../types/towerWar';
import { initialCountryWarGameState } from '../types/countryWar';

export const gameModes: GameMode[] = [
  {
    id: 'color-duel',
    name: 'Color Duel',
    description: 'Classic 3x3 grid battle with steal mechanic',
    component: ColorDuelBoard,
    initialState: () => ({ ...initialColorDuelGameState }),
    gameLogic: ColorDuelLogic
  },
  {
    id: 'tower-war',
    name: 'Tower War',
    description: 'Build your tower to 10 levels while sabotaging your opponent',
    component: TowerWarBoard,
    initialState: () => ({ ...initialTowerWarGameState }),
    gameLogic: TowerWarLogic
  },
  {
    id: 'country-war',
    name: 'Country War',
    description: 'Strategic territory conquest with base building and army movement',
    component: CountryWarBoard,
    initialState: () => ({ ...initialCountryWarGameState }),
    gameLogic: CountryWarLogic
  }
];

export function getGameMode(id: string): GameMode | undefined {
  return gameModes.find(mode => mode.id === id);
}