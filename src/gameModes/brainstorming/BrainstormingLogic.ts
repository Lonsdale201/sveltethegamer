import { debugLog } from '../../config/debug';
import type { BrainstormingGameState, BrainstormingMoveData, PlayerAnswer, Question } from '../../types/brainstorming';
import type { GameSettings } from '../../types/core';
import type { Player } from '../../types/core';
import { getQuestionsByLanguage } from './questions';

export function checkWinner(gameState: BrainstormingGameState): Player | null {
  const targetScore = gameState.gameSettings.targetScore;
  
  if (gameState.playerScores.red >= targetScore && gameState.playerScores.blue >= targetScore) {
    // Both reached target, highest score wins
    if (gameState.playerScores.red > gameState.playerScores.blue) return 'red';
    if (gameState.playerScores.blue > gameState.playerScores.red) return 'blue';
    return null; // Tie, continue playing
  }
  
  if (gameState.playerScores.red >= targetScore) return 'red';
  if (gameState.playerScores.blue >= targetScore) return 'blue';
  
  // Check if all questions are answered
  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    if (gameState.playerScores.red > gameState.playerScores.blue) return 'red';
    if (gameState.playerScores.blue > gameState.playerScores.red) return 'blue';
    return null; // Tie
  }
  
  return null;
}

export function canMakeMove(gameState: BrainstormingGameState, moveData: BrainstormingMoveData, player: Player): boolean {
  debugLog('Brainstorming canMakeMove:', { moveData, player, gameState });
  
  if (gameState.winner || !gameState.gameStarted) return false;
  
  // Check if player has already answered current question
  if (gameState.answersSubmitted[player]) return false;
  
  // Check if question exists
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  if (!currentQuestion || moveData.questionId !== currentQuestion.id) return false;
  
  return true;
}

export function makeMove(gameState: BrainstormingGameState, moveData: BrainstormingMoveData, player: Player): BrainstormingGameState {
  if (!canMakeMove(gameState, moveData, player)) {
    debugLog('Brainstorming makeMove: Invalid move attempted by', player, 'moveData:', moveData);
    return gameState;
  }

  debugLog('Brainstorming makeMove: Valid move by', player, 'moveData:', moveData);
  
  const newState = { ...gameState };
  newState.playerAnswers = {
    red: [...gameState.playerAnswers.red],
    blue: [...gameState.playerAnswers.blue]
  };
  newState.playerScores = { ...gameState.playerScores };
  newState.answersSubmitted = { ...gameState.answersSubmitted };
  
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const points = calculatePoints(moveData.answer, currentQuestion);
  
  const playerAnswer: PlayerAnswer = {
    questionId: moveData.questionId,
    answer: moveData.answer,
    points: points.points,
    isExact: points.isExact,
    timestamp: Date.now()
  };
  
  newState.playerAnswers[player].push(playerAnswer);
  newState.playerScores[player] += points.points;
  newState.answersSubmitted[player] = true;
  
  // Check if both players have answered
  if (newState.answersSubmitted.red && newState.answersSubmitted.blue) {
    // Move to next question or end game
    if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
      newState.currentQuestionIndex++;
      newState.answersSubmitted = { red: false, blue: false };
      newState.questionStartTime = Date.now();
      newState.turnStartTime = Date.now();
      newState.timeRemaining = gameState.turnTimeLimit;
    }
  }
  
  newState.winner = checkWinner(newState);
  
  return newState;
}

function calculatePoints(answer: string | number, question: Question): { points: number; isExact: boolean } {
  if (question.type === 'select') {
    const isCorrect = answer === question.correctAnswer;
    return {
      points: isCorrect ? question.exactPoints : 0,
      isExact: isCorrect
    };
  }
  
  if (question.type === 'number') {
    const numAnswer = typeof answer === 'number' ? answer : parseInt(answer.toString());
    const correctAnswer = typeof question.correctAnswer === 'number' ? question.correctAnswer : parseInt(question.correctAnswer.toString());
    
    if (numAnswer === correctAnswer) {
      return {
        points: question.exactPoints,
        isExact: true
      };
    }
    
    // For number questions, award close points if available
    if (question.closePoints) {
      return {
        points: question.closePoints,
        isExact: false
      };
    }
  }
  
  return { points: 0, isExact: false };
}

export function resetGame(gameSettings: GameSettings): BrainstormingGameState {
  const language = gameSettings.brainstormingSettings?.language ?? 'HU';
  const targetScore = gameSettings.brainstormingSettings?.targetScore ?? 10;
  
  const questions = getQuestionsByLanguage(language);
  const now = Date.now();
  
  return {
    questions,
    currentQuestionIndex: 0,
    playerAnswers: { red: [], blue: [] },
    playerScores: { red: 0, blue: 0 },
    answersSubmitted: { red: false, blue: false },
    questionStartTime: now,
    gameSettings: {
      targetScore,
      language
    },
    gameStarted: true,
    currentTurn: 'red',
    winner: null,
    turnTimeLimit: gameSettings.turnTimeLimit,
    turnStartTime: now,
    timeRemaining: gameSettings.turnTimeLimit,
  };
}

export function skipTurn(gameState: BrainstormingGameState): BrainstormingGameState {
  const newState = { ...gameState };
  const now = Date.now();
  
  // In brainstorming, we don't really skip turns since both players answer simultaneously
  // But we can use this for timeout handling
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  
  return newState;
}