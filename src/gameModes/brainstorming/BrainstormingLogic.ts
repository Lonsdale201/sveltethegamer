import { debugLog } from '../../config/debug';
import type { BrainstormingGameState, BrainstormingMoveData, PlayerAnswer, Question } from '../../types/brainstorming';
import type { GameSettings } from '../../types/core';
import type { Player } from '../../types/core';
import { getQuestionsByLanguage } from './questions';
import { TurnManager } from '../../core/TurnManager';

export function checkWinner(gameState: BrainstormingGameState): Player | null {
  const targetScore = gameState.gameSettings.targetScore;
  
  // If target score is 0, play all questions and highest score wins
  if (targetScore === 0) {
    // Check if all questions are answered
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
      if (gameState.playerScores.red > gameState.playerScores.blue) return 'red';
      if (gameState.playerScores.blue > gameState.playerScores.red) return 'blue';
      return null; // Tie
    }
    return null; // Game continues
  }
  
  // Normal target score logic
  if (gameState.playerScores.red >= targetScore && gameState.playerScores.blue >= targetScore) {
    // Both reached target, highest score wins
    if (gameState.playerScores.red > gameState.playerScores.blue) return 'red';
    if (gameState.playerScores.blue > gameState.playerScores.red) return 'blue';
    return null; // Tie, continue playing
  }
  
  if (gameState.playerScores.red >= targetScore) return 'red';
  if (gameState.playerScores.blue >= targetScore) return 'blue';
  
  // Check if all questions are answered (fallback)
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
  
  // Don't allow moves during feedback phase
  if (gameState.showingFeedback) return false;
  
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
  newState.answersSubmitted[player] = true;
  
  debugLog('Brainstorming makeMove: Player answer added:', playerAnswer);
  debugLog('Brainstorming makeMove: Current answers submitted:', newState.answersSubmitted);
  
  // Apply score immediately when player submits answer
  newState.playerScores[player] += points.points;
  debugLog(`Brainstorming makeMove: Applied ${points.points} points to ${player} immediately, new score: ${newState.playerScores[player]}`);
  
  // Check if both players have answered
  const bothAnswered = newState.answersSubmitted.red && newState.answersSubmitted.blue;
  
  debugLog('Brainstorming makeMove: Both answered?', bothAnswered);
  
  if (bothAnswered) {
    // Start feedback phase
    newState.showingFeedback = true;
    newState.feedbackStartTime = Date.now();
    newState.feedbackTimeRemaining = 6; // 6 seconds feedback
    
    // Check for winner after applying scores
    newState.winner = checkWinner(newState);
    
    debugLog('Brainstorming makeMove: Feedback phase started, current scores:', newState.playerScores);
  }
  
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
    
    // For number questions, award close points if available and answer is close
    if (question.closePoints && question.closePoints > 0) {
      const difference = Math.abs(numAnswer - correctAnswer);
      const tolerance = Math.max(1, Math.floor(correctAnswer * 0.1)); // 10% tolerance or minimum 1
      
      if (difference <= tolerance) {
        return {
          points: question.closePoints,
          isExact: false
        };
      }
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
    showingFeedback: false,
    feedbackStartTime: 0,
    feedbackTimeRemaining: 0,
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
    turnState: TurnManager.initializeTurnState('simultaneous'),
  };
}

export function skipTurn(gameState: BrainstormingGameState): BrainstormingGameState {
  const newState = { ...gameState };
  const now = Date.now();
  
  debugLog('Brainstorming skipTurn called, showingFeedback:', gameState.showingFeedback);
  
  // If in feedback phase, advance to next question
  if (gameState.showingFeedback) {
    newState.showingFeedback = false;
    newState.feedbackStartTime = 0;
    newState.feedbackTimeRemaining = 0;
    
    // Move to next question
    if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
      newState.currentQuestionIndex++;
      newState.answersSubmitted = { red: false, blue: false };
      newState.questionStartTime = now;
      newState.turnStartTime = now;
      newState.timeRemaining = gameState.turnTimeLimit;
      
      debugLog('Brainstorming skipTurn: Advanced to next question', newState.currentQuestionIndex);
    }
    
    newState.winner = checkWinner(newState);
    return newState;
  }
  
  // Handle timeout: mark players who haven't submitted as having submitted a "no answer" (0 points)
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  
  debugLog('Brainstorming skipTurn: Handling timeout for question:', currentQuestion?.id);
  debugLog('Brainstorming skipTurn: Current answers submitted before timeout:', gameState.answersSubmitted);
  
  if (currentQuestion) {
    newState.playerAnswers = {
      red: [...gameState.playerAnswers.red],
      blue: [...gameState.playerAnswers.blue]
    };
    newState.answersSubmitted = { ...gameState.answersSubmitted };
    
    let anyTimeoutAnswersAdded = false;
    
    for (const player of ['red', 'blue'] as Player[]) {
      if (!gameState.answersSubmitted[player]) {
        // Create a timeout answer with 0 points
        const timeoutAnswer: PlayerAnswer = {
          questionId: currentQuestion.id,
          answer: 'No answer (timeout)',
          points: 0,
          isExact: false,
          timestamp: now
        };
        
        newState.playerAnswers[player].push(timeoutAnswer);
        newState.answersSubmitted[player] = true;
        anyTimeoutAnswersAdded = true;
        
        debugLog(`Brainstorming skipTurn: Added timeout answer for ${player}:`, timeoutAnswer);
      }
    }
    
    // If we added timeout answers, start feedback phase
    if (anyTimeoutAnswersAdded && newState.answersSubmitted.red && newState.answersSubmitted.blue) {
      // Start feedback phase
      newState.showingFeedback = true;
      newState.feedbackStartTime = now;
      newState.feedbackTimeRemaining = 6;
      
      // Apply scores for all answers (including timeout answers with 0 points)
      for (const player of ['red', 'blue'] as Player[]) {
        const playerAnswer = newState.playerAnswers[player].find(a => a.questionId === currentQuestion.id);
        if (playerAnswer) {
          newState.playerScores[player] += playerAnswer.points;
          debugLog(`Brainstorming skipTurn: Applied ${playerAnswer.points} points to ${player} (timeout), new score: ${newState.playerScores[player]}`);
        }
      }
      
      debugLog('Brainstorming skipTurn: Started feedback phase after timeout, scores:', newState.playerScores);
    }
  }
  
  // Always switch turns to maintain GameManager's turn logic
  newState.currentTurn = gameState.currentTurn === 'red' ? 'blue' : 'red';
  newState.turnStartTime = now;
  newState.timeRemaining = gameState.turnTimeLimit;
  
  newState.winner = checkWinner(newState);
  
  debugLog('Brainstorming skipTurn: Final state:', {
    showingFeedback: newState.showingFeedback,
    answersSubmitted: newState.answersSubmitted,
    scores: newState.playerScores,
    winner: newState.winner
  });
  
  return newState;
}