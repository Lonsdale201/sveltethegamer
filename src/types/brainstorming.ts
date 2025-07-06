import type { BaseGameState, Player } from './core';

export type QuestionType = 'select' | 'number';
export type Language = 'HU' | 'EN';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  language: Language;
  options?: string[]; // For select type
  correctAnswer: string | number;
  exactPoints: number; // Points for exact answer
  closePoints?: number; // Points for closest answer (number type only)
}

export interface PlayerAnswer {
  questionId: string;
  answer: string | number;
  points: number;
  isExact: boolean;
  timestamp: number;
}

export interface BrainstormingGameState extends BaseGameState {
  questions: Question[];
  currentQuestionIndex: number;
  playerAnswers: Record<Player, PlayerAnswer[]>;
  playerScores: Record<Player, number>;
  answersSubmitted: Record<Player, boolean>;
  questionStartTime: number;
  gameSettings: {
    targetScore: number;
    language: Language;
  };
}

export interface BrainstormingMoveData {
  type: 'submitAnswer';
  questionId: string;
  answer: string | number;
  player: Player;
}

export const initialBrainstormingGameState: BrainstormingGameState = {
  questions: [],
  currentQuestionIndex: 0,
  playerAnswers: { red: [], blue: [] },
  playerScores: { red: 0, blue: 0 },
  answersSubmitted: { red: false, blue: false },
  questionStartTime: 0,
  gameSettings: {
    targetScore: 10,
    language: 'HU'
  },
  gameStarted: false,
  currentTurn: 'red',
  winner: null,
  turnTimeLimit: 0,
  turnStartTime: 0,
  timeRemaining: 0,
};