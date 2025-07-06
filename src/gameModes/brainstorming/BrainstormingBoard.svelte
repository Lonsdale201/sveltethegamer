<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { debugLog } from '../../config/debug';
  import type { BrainstormingGameState, BrainstormingMoveData, Question } from '../../types/brainstorming';
  import type { PlayerInfo, GameSettings } from '../../types/core';
  import type { Player } from '../../types/core';
  import { canMakeMove } from './BrainstormingLogic';

  export let gameState: BrainstormingGameState;
  export let myColor: Player;
  export let connected: boolean;
  export let myPlayerInfo: PlayerInfo;
  export let opponentInfo: PlayerInfo | null;
  export let gameSettings: GameSettings;

  const dispatch = createEventDispatcher();

  let selectedOption = '';
  let numberAnswer = '';

  // Reactive logging for props
  $: {
    debugLog('BrainstormingBoard reactive props update:', {
      gameState,
      myColor,
      connected,
      myPlayerInfo,
      opponentInfo
    });
  }

  $: currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  $: opponentColor = myColor === 'red' ? 'blue' : 'red';
  $: myScore = gameState.playerScores[myColor];
  $: opponentScore = gameState.playerScores[opponentColor];
  $: hasAnswered = gameState.answersSubmitted[myColor];
  $: opponentAnswered = gameState.answersSubmitted[opponentColor];
  $: bothAnswered = hasAnswered && opponentAnswered;
  $: isLastQuestion = gameState.currentQuestionIndex >= gameState.questions.length - 1;
  $: targetScore = gameState.gameSettings.targetScore;

  function handleSubmitAnswer() {
    if (!currentQuestion || hasAnswered) return;

    let answer: string | number;
    if (currentQuestion.type === 'select') {
      if (!selectedOption) return;
      answer = selectedOption;
    } else {
      if (!numberAnswer) return;
      answer = parseInt(numberAnswer);
    }

    const moveData: BrainstormingMoveData = {
      type: 'submitAnswer',
      questionId: currentQuestion.id,
      answer,
      player: myColor
    };

    debugLog('BrainstormingBoard dispatching answer:', moveData);
    dispatch('move', moveData);
    
    // Reset form
    selectedOption = '';
    numberAnswer = '';
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }

  function getLastAnswerResult(player: Player) {
    const answers = gameState.playerAnswers[player];
    if (answers.length === 0) return null;
    
    const lastAnswer = answers[answers.length - 1];
    if (lastAnswer.questionId !== currentQuestion?.id) return null;
    
    return lastAnswer;
  }

  function getScoreProgress(score: number): number {
    if (targetScore === 0) return 0;
    return Math.min(100, (score / targetScore) * 100);
  }

  function getScoreColor(score: number): string {
    const progress = getScoreProgress(score);
    if (progress >= 80) return '#10b981'; // Green
    if (progress >= 50) return '#f59e0b'; // Orange
    return '#3b82f6'; // Blue
  }

  function getFeedbackProgress(): number {
    if (!gameState.showingFeedback) return 0;
    const elapsed = (Date.now() - gameState.feedbackStartTime) / 1000;
    return Math.max(0, Math.min(100, (elapsed / 6) * 100));
  }

  $: myLastAnswer = getLastAnswerResult(myColor);
  $: opponentLastAnswer = getLastAnswerResult(opponentColor);
</script>

<!-- Fixed Timer at Top -->
{#if connected && gameState.gameStarted && !gameState.winner && gameState.turnTimeLimit > 0 && !gameState.showingFeedback}
  <div class="fixed-timer" class:urgent={gameState.timeRemaining <= 5}>
    <div class="timer-content">
      <span class="timer-icon">⏱️</span>
      <span class="timer-display">{formatTime(gameState.timeRemaining)}</span>
      <div class="timer-bar">
        <div 
          class="timer-progress" 
          style="width: {(gameState.timeRemaining / gameState.turnTimeLimit) * 100}%"
        ></div>
      </div>
    </div>
  </div>
{/if}

<div class="game-container">
  <div class="game-status">
    {#if connected && gameState.gameStarted}
      <!-- Score Display -->
      <div class="score-section">
        <div class="score-card my-score">
          <div class="score-header">
            <span class="color-indicator {myColor}"></span>
            <span class="player-name">{myPlayerInfo?.name || 'You'}</span>
            {#if hasAnswered && !gameState.showingFeedback}
              <span class="status-indicator answered">✓</span>
            {:else if !gameState.showingFeedback}
              <span class="status-indicator thinking">🤔</span>
            {/if}
          </div>
          <div class="score-display">
            <div class="score-number" style="color: {getScoreColor(myScore)}">{myScore}</div>
            <div class="score-label">points</div>
            {#if targetScore > 0}
              <div class="score-target">/ {targetScore}</div>
              <div class="score-progress-bar">
                <div 
                  class="score-progress-fill" 
                  style="width: {getScoreProgress(myScore)}%; background-color: {getScoreColor(myScore)}"
                ></div>
              </div>
            {/if}
          </div>
        </div>

        <div class="vs-divider">VS</div>

        <div class="score-card opponent-score">
          <div class="score-header">
            <span class="color-indicator {opponentColor}"></span>
            <span class="player-name">{opponentInfo?.name || 'Opponent'}</span>
            {#if opponentAnswered && !gameState.showingFeedback}
              <span class="status-indicator answered">✓</span>
            {:else if !gameState.showingFeedback}
              <span class="status-indicator thinking">🤔</span>
            {/if}
          </div>
          <div class="score-display">
            <div class="score-number" style="color: {getScoreColor(opponentScore)}">{opponentScore}</div>
            <div class="score-label">points</div>
            {#if targetScore > 0}
              <div class="score-target">/ {targetScore}</div>
              <div class="score-progress-bar">
                <div 
                  class="score-progress-fill" 
                  style="width: {getScoreProgress(opponentScore)}%; background-color: {getScoreColor(opponentScore)}"
                ></div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if currentQuestion && !gameState.winner}
    <div class="question-container">
      <div class="question-header">
        <div class="question-number">
          Question {gameState.currentQuestionIndex + 1} / {gameState.questions.length}
        </div>
        <div class="language-indicator">
          {gameState.gameSettings.language === 'HU' ? '🇭🇺' : '🇬🇧'}
        </div>
      </div>
      
      <div class="question-card" class:feedback-mode={gameState.showingFeedback}>
        {#if gameState.showingFeedback}
          <!-- Feedback Progress Border -->
          <div class="feedback-progress-border">
            <div 
              class="feedback-progress-fill" 
              style="width: {getFeedbackProgress()}%"
            ></div>
          </div>
        {/if}
        
        <h2 class="question-text">{currentQuestion.text}</h2>
        
        {#if gameState.showingFeedback}
          <!-- Feedback Phase -->
          <div class="feedback-section">
            <h3>📊 Round Results</h3>
            
            <div class="feedback-grid">
              <div class="feedback-card my-feedback">
                <div class="feedback-header">
                  <span class="color-indicator {myColor}"></span>
                  <span>{myPlayerInfo?.name || 'You'}</span>
                </div>
                {#if myLastAnswer}
                  <div class="feedback-answer">
                    <div class="answer-label">Your Answer:</div>
                    <div class="answer-value">{myLastAnswer.answer}</div>
                  </div>
                  <div class="feedback-points" class:correct={myLastAnswer.points > 0}>
                    {#if myLastAnswer.points > 0}
                      +{myLastAnswer.points} points {myLastAnswer.isExact ? '🎯' : '📍'}
                    {:else}
                      0 points ❌
                    {/if}
                  </div>
                {:else}
                  <div class="feedback-answer">
                    <div class="answer-label">Your Answer:</div>
                    <div class="answer-value timeout">No answer (timeout)</div>
                  </div>
                  <div class="feedback-points">
                    0 points ❌
                  </div>
                {/if}
              </div>
              
              <div class="feedback-card opponent-feedback">
                <div class="feedback-header">
                  <span class="color-indicator {opponentColor}"></span>
                  <span>{opponentInfo?.name || 'Opponent'}</span>
                </div>
                {#if opponentLastAnswer}
                  <div class="feedback-answer">
                    <div class="answer-label">Their Answer:</div>
                    <div class="answer-value">{opponentLastAnswer.answer}</div>
                  </div>
                  <div class="feedback-points" class:correct={opponentLastAnswer.points > 0}>
                    {#if opponentLastAnswer.points > 0}
                      +{opponentLastAnswer.points} points {opponentLastAnswer.isExact ? '🎯' : '📍'}
                    {:else}
                      0 points ❌
                    {/if}
                  </div>
                {:else}
                  <div class="feedback-answer">
                    <div class="answer-label">Their Answer:</div>
                    <div class="answer-value timeout">No answer (timeout)</div>
                  </div>
                  <div class="feedback-points">
                    0 points ❌
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="correct-answer">
              <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
            </div>
            
            <div class="next-question-info">
              {#if !isLastQuestion}
                Next question in {gameState.feedbackTimeRemaining} seconds...
              {:else}
                Calculating final results...
              {/if}
            </div>
          </div>
        {:else}
          <!-- Question Phase -->
          {#if !hasAnswered}
            <div class="answer-section">
              {#if currentQuestion.type === 'select'}
                <div class="options-container">
                  {#each currentQuestion.options || [] as option}
                    <label class="option-label">
                      <input 
                        type="radio" 
                        bind:group={selectedOption} 
                        value={option}
                        class="option-radio"
                      />
                      <span class="option-text">{option}</span>
                    </label>
                  {/each}
                </div>
              {:else if currentQuestion.type === 'number'}
                <div class="number-input-container">
                  <input 
                    type="number" 
                    bind:value={numberAnswer}
                    placeholder="Enter your answer"
                    class="number-input"
                  />
                </div>
              {/if}
              
              <button 
                class="submit-btn"
                on:click={handleSubmitAnswer}
                disabled={currentQuestion.type === 'select' ? !selectedOption : !numberAnswer}
              >
                🎯 Submit Answer
              </button>
            </div>
          {:else}
            <div class="waiting-section">
              <div class="answer-submitted">
                ✅ Answer submitted!
                {#if myLastAnswer}
                  <div class="my-answer">
                    Your answer: <strong>{myLastAnswer.answer}</strong>
                  </div>
                {/if}
              </div>
              
              {#if !opponentAnswered}
                <div class="waiting-opponent">
                  Waiting for opponent to answer...
                  <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                  </div>
                </div>
              {:else}
                <div class="both-answered">
                  Both players answered! Showing results...
                </div>
              {/if}
            </div>
          {/if}
          
          <div class="question-info">
            <div class="points-info">
              {#if currentQuestion.type === 'select'}
                <span class="points-label">Correct answer: {currentQuestion.exactPoints} points</span>
              {:else}
                <span class="points-label">
                  Exact answer: {currentQuestion.exactPoints} points
                  {#if currentQuestion.closePoints}
                    • Close answer: {currentQuestion.closePoints} points
                  {/if}
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if gameState.winner}
    <div class="game-over-overlay">
      <div class="game-over-popup" on:click|stopPropagation>
        {#if gameState.winner === myColor}
          <div class="win-content">
            <div class="win-emoji">🧠</div>
            <h2>Victory!</h2>
            <p>You outsmarted your opponent!</p>
          </div>
        {:else}
          <div class="lose-content">
            <div class="lose-emoji">🤯</div>
            <h2>Defeat!</h2>
            <p>Your opponent was quicker and smarter!</p>
          </div>
        {/if}
        
        <div class="final-scores">
          <h3>Final Results</h3>
          <div class="final-score-grid">
            <div class="final-score-item" class:winner={gameState.winner === myColor}>
              <span class="color-indicator {myColor}"></span>
              <span class="final-player-name">{myPlayerInfo?.name || 'You'}</span>
              <span class="final-score">{myScore} points</span>
              {#if gameState.winner === myColor}
                <span class="winner-crown">👑</span>
              {/if}
            </div>
            <div class="final-score-item" class:winner={gameState.winner === opponentColor}>
              <span class="color-indicator {opponentColor}"></span>
              <span class="final-player-name">{opponentInfo?.name || 'Opponent'}</span>
              <span class="final-score">{opponentScore} points</span>
              {#if gameState.winner === opponentColor}
                <span class="winner-crown">👑</span>
              {/if}
            </div>
          </div>
          
          {#if targetScore > 0}
            <div class="target-info">
              Target: {targetScore} points
            </div>
          {:else}
            <div class="target-info">
              Out of {gameState.questions.length} questions
            </div>
          {/if}
        </div>
        
        <button on:click={() => dispatch('reset')} class="reset-btn">
          New Quiz
        </button>
        <button on:click={() => dispatch('mainMenu')} class="main-menu-btn">
          Main Menu
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .fixed-timer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 2px solid #e5e7eb;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
  }

  .fixed-timer.urgent {
    background: rgba(239, 68, 68, 0.95);
    border-bottom-color: #dc2626;
    animation: pulse-urgent 1s infinite;
  }

  .timer-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .timer-icon {
    font-size: 1.2rem;
  }

  .timer-display {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    font-family: 'Courier New', monospace;
    min-width: 60px;
    text-align: center;
  }

  .urgent .timer-display {
    color: white;
  }

  .timer-bar {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    max-width: 150px;
  }

  .timer-progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    transition: width 0.1s linear;
    border-radius: 3px;
  }

  .urgent .timer-progress {
    background: linear-gradient(90deg, #ffffff, #f3f4f6);
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding-top: 5rem;
  }

  .game-status {
    text-align: center;
    width: 100%;
  }

  .score-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    backdrop-filter: blur(5px);
    flex-wrap: wrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid #e5e7eb;
    min-width: 160px;
    transition: all 0.3s ease;
  }

  .my-score {
    border-color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.8));
  }

  .opponent-score {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 255, 255, 0.8));
  }

  .score-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .score-number {
    font-size: 2.5rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    line-height: 1;
  }

  .score-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-style: italic;
    margin-top: -0.25rem;
  }

  .score-target {
    font-size: 1rem;
    color: #6b7280;
    font-weight: 500;
  }

  .score-progress-bar {
    width: 100px;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 0.25rem;
  }

  .score-progress-fill {
    height: 100%;
    transition: width 0.5s ease;
    border-radius: 3px;
  }

  .vs-divider {
    font-weight: bold;
    color: #666;
    font-size: 1.2rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #e5e7eb;
  }

  .color-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-block;
  }

  .color-indicator.red {
    background-color: #ef4444;
  }

  .color-indicator.blue {
    background-color: #3b82f6;
  }

  .player-name {
    font-size: 0.9rem;
    color: #333;
  }

  .status-indicator {
    font-size: 1rem;
  }

  .status-indicator.answered {
    color: #10b981;
  }

  .status-indicator.thinking {
    animation: pulse-thinking 2s infinite;
  }

  .question-container {
    width: 100%;
    max-width: 600px;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .question-number {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  .language-indicator {
    font-size: 1.5rem;
  }

  .question-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border: 2px solid #e5e7eb;
    position: relative;
    overflow: hidden;
  }

  .question-card.feedback-mode {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(255, 255, 255, 0.95));
  }

  .feedback-progress-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #e5e7eb;
    z-index: 1;
  }

  .feedback-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #d97706);
    transition: width 0.1s linear;
  }

  .question-text {
    color: #1f2937;
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 2rem 0;
    text-align: center;
    line-height: 1.4;
  }

  .feedback-section {
    text-align: center;
  }

  .feedback-section h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }

  .feedback-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .feedback-card {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
  }

  .feedback-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: bold;
  }

  .feedback-answer {
    margin-bottom: 0.75rem;
    color: #374151;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .answer-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .answer-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #1f2937;
    background: rgba(255, 255, 255, 0.8);
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    font-family: 'Courier New', monospace;
  }

  .answer-value.timeout {
    color: #ef4444;
    font-style: italic;
    font-family: inherit;
  }

  .feedback-points {
    font-weight: bold;
    padding: 0.5rem;
    border-radius: 8px;
    background: #ef4444;
    color: white;
  }

  .feedback-points.correct {
    background: #10b981;
  }

  .correct-answer {
    text-align: center;
    padding: 1rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border-radius: 12px;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .next-question-info {
    color: #6b7280;
    font-style: italic;
    font-size: 0.9rem;
  }

  .answer-section {
    margin-bottom: 1.5rem;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .option-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .option-label:hover {
    background: #e3f2fd;
    border-color: #3b82f6;
    transform: translateY(-1px);
  }

  .option-radio {
    width: 20px;
    height: 20px;
    accent-color: #3b82f6;
  }

  .option-text {
    font-size: 1rem;
    color: #374151;
    font-weight: 500;
  }

  .number-input-container {
    margin-bottom: 2rem;
  }

  .number-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1.2rem;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .number-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .submit-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .waiting-section {
    text-align: center;
    padding: 2rem 0;
  }

  .answer-submitted {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .my-answer {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }

  .waiting-opponent {
    color: #6b7280;
    font-style: italic;
  }

  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }

  .both-answered {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 1rem;
    border-radius: 12px;
    font-weight: bold;
  }

  .question-info {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
    text-align: center;
  }

  .points-label {
    color: #6b7280;
    font-size: 0.9rem;
    font-style: italic;
  }

  .game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .game-over-popup {
    background: white;
    border-radius: 20px;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    animation: popup-appear 0.3s ease-out;
  }

  .win-content, .lose-content {
    margin-bottom: 2rem;
  }

  .win-emoji, .lose-emoji {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce-emoji 0.6s ease-out;
  }

  .win-content h2 {
    color: #10b981;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(16, 185, 129, 0.3);
  }

  .lose-content h2 {
    color: #ef4444;
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(239, 68, 68, 0.3);
  }

  .win-content p, .lose-content p {
    font-size: 1.2rem;
    color: #666;
    margin: 0 0 1rem 0;
  }

  .final-scores {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
  }

  .final-scores h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.3rem;
  }

  .final-score-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .final-score-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
  }

  .final-score-item.winner {
    border-color: #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), white);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  }

  .final-player-name {
    flex: 1;
    text-align: left;
    font-weight: 500;
  }

  .final-score {
    font-size: 1.2rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: #333;
  }

  .winner-crown {
    font-size: 1.5rem;
    animation: bounce-crown 1s infinite;
  }

  .target-info {
    text-align: center;
    color: #6b7280;
    font-size: 0.9rem;
    font-style: italic;
  }

  .reset-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  .main-menu-btn {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    margin-top: 1rem;
  }

  .main-menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
  }

  @keyframes pulse-thinking {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse-urgent {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.01);
    }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  @keyframes popup-appear {
    0% {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes bounce-emoji {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-20px);
    }
    60% {
      transform: translateY(-10px);
    }
  }

  @keyframes bounce-crown {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-2px);
    }
  }

  @media (max-width: 768px) {
    .game-container {
      padding: 0.5rem;
      gap: 1rem;
      padding-top: 4.5rem;
    }
    
    .question-card {
      padding: 1.5rem;
    }
    
    .question-text {
      font-size: 1.2rem;
    }
    
    .feedback-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .timer-content {
      gap: 0.5rem;
    }
    
    .timer-display {
      font-size: 1.2rem;
    }
    
    .fixed-timer {
      padding: 0.5rem;
    }
  }

  /* Responsive design for different screen sizes */
  @media (max-width: 425px) {
    .score-section {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    
    .score-card {
      min-width: 140px;
      padding: 0.75rem;
      gap: 0.5rem;
    }
    
    .score-number {
      font-size: 2rem;
    }
    
    .score-progress-bar {
      width: 80px;
    }
    
    .vs-divider {
      order: 1;
      margin: 0.25rem 0;
      width: 35px;
      height: 35px;
      font-size: 1rem;
    }
  }

  @media (min-width: 426px) and (max-width: 768px) {
    .score-section {
      flex-direction: row;
      gap: 0.75rem;
      padding: 0.75rem;
    }
    
    .score-card {
      min-width: 120px;
      padding: 0.75rem;
      gap: 0.5rem;
      flex: 1;
      max-width: 150px;
    }
    
    .score-number {
      font-size: 2rem;
    }
    
    .score-progress-bar {
      width: 80px;
    }
    
    .vs-divider {
      width: 35px;
      height: 35px;
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    .score-header {
      gap: 0.25rem;
    }
    
    .player-name {
      font-size: 0.8rem;
    }
    
    .status-indicator {
      font-size: 0.9rem;
    }
  }
</style>