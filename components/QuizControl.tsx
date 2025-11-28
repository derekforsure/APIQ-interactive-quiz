'use client';

import { useState, useEffect } from 'react';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import { useQuizAudio } from '@/hooks/useQuizAudio';
import { QuizHeader } from './quiz/QuizHeader';
import { QuizCountdown } from './quiz/QuizCountdown';
import { QuizQuestionPanel } from './quiz/QuizQuestionPanel';
import { QuizLeaderboard } from './quiz/QuizLeaderboard';
import { QuizLiveStatus } from './quiz/QuizLiveStatus';

interface Question {
  id: number;
  text: string;
  answer: string;
}

interface QuizControlProps {
  sessionId: string;
  onScoringModeChange?: (mode: 'individual' | 'department') => void;
}

export default function QuizControl({ sessionId, onScoringModeChange }: QuizControlProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    quizState,
    isConnected,
    countdown,
    finalLeaderboardScores,
    sendCommand,
  } = useQuizSocket({ sessionId, onScoringModeChange });

  const { playCorrect, playIncorrect } = useQuizAudio();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/questions`);
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.data);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [sessionId]);

  const handleNextQuestion = () => {
    if (!quizState) return;
    const nextQuestionIndex = quizState.currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      sendCommand('NEXT_QUESTION', { questionId: questions[nextQuestionIndex].id });
    } else {
      sendCommand('END_QUIZ');
    }
  };

  const handleEndQuiz = () => {
    if (confirm('Are you sure you want to end the quiz?')) {
      sendCommand('END_QUIZ');
    }
  };

  const handleJudgeAnswer = (correct: boolean) => {
    if (quizState?.activeStudent) {
      if (correct) {
        playCorrect();
      } else {
        playIncorrect();
      }
      sendCommand('JUDGE_ANSWER', { correct, questionId: questions[quizState.currentQuestionIndex]?.id });
    }
  };

  const handleScoringModeChange = (mode: 'individual' | 'department') => {
    sendCommand('SET_SCORING_MODE', { mode });
    if (onScoringModeChange) {
      onScoringModeChange(mode);
    }
  };

  const handleResetScores = async () => {
    if (confirm('Are you sure you want to permanently reset all scores for this session? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/reset-scores`, {
          method: 'POST',
        });
        if (response.ok) {
          sendCommand('RESET_STATE');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to reset scores');
        }
      } catch (err) {
        alert(`Failed to reset scores: ${(err as Error).message}`);
        console.error('Error resetting scores:', err);
      }
    }
  };

  const openPresentationView = () => {
    window.open(`/presentation/${sessionId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizHeader
        isQuizEnded={Boolean(quizState?.isQuizEnded)}
        isQuizStarted={Boolean(quizState?.isQuizStarted)}
        scoringMode={quizState?.scoringMode || 'individual'}
        onScoringModeChange={handleScoringModeChange}
        onOpenPresentation={openPresentationView}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        <QuizCountdown countdown={countdown} />

        <QuizQuestionPanel
          questions={questions}
          quizState={quizState}
          isConnected={isConnected}
          onStartQuiz={() => sendCommand('START_QUIZ')}
          onNextQuestion={handleNextQuestion}
          onEndQuiz={handleEndQuiz}
          onResetScores={handleResetScores}
        />

        <QuizLeaderboard
          quizState={quizState}
          finalLeaderboardScores={finalLeaderboardScores}
        />

        <QuizLiveStatus
          quizState={quizState}
          onJudgeAnswer={handleJudgeAnswer}
        />
      </div>
    </div>
  );
}