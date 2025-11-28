import React from 'react';
import { QuizState } from '@/hooks/useQuizSocket';

interface Question {
  id: number;
  text: string;
  answer: string;
}

interface QuizQuestionPanelProps {
  questions: Question[];
  quizState: QuizState | null;
  isConnected: boolean;
  onStartQuiz: () => void;
  onNextQuestion: () => void;
  onEndQuiz: () => void;
  onResetScores: () => void;
}

export function QuizQuestionPanel({
  questions,
  quizState,
  isConnected,
  onStartQuiz,
  onNextQuestion,
  onEndQuiz,
  onResetScores,
}: QuizQuestionPanelProps) {
  const isQuizEnded = quizState?.isQuizEnded;
  const isQuizStarted = quizState?.isQuizStarted;
  const currentQuestion = questions[quizState?.currentQuestionIndex ?? 0];

  return (
    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Question</h3>
      </div>
      <div className="p-5">
        {isQuizEnded ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-16 w-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-gray-900 mt-4">Quiz Completed</p>
            <p className="text-sm text-gray-500 mt-1">All questions have been answered</p>
          </div>
        ) : isQuizStarted ? (
          currentQuestion ? (
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-3">
                  Question {(quizState?.currentQuestionIndex ?? 0) + 1} of {questions.length}
                </span>
                <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.text}</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Answer</span>
                  {quizState?.showAnswer && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Visible
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-900">
                  {currentQuestion.answer}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No more questions available</p>
            </div>
          )
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500 mt-2">Waiting to start quiz...</p>
          </div>
        )}
      </div>
      <div className="p-5 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          {/* Start Quiz Button */}
          {Boolean(!isQuizStarted && !isQuizEnded) && (
            <button
              onClick={onStartQuiz}
              disabled={Boolean(!isConnected || !quizState)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Quiz
            </button>
          )}

          {/* Next Question Button */}
          {Boolean(isQuizStarted && !isQuizEnded) && (
            <button
              onClick={onNextQuestion}
              disabled={Boolean(quizState && (quizState.currentQuestionIndex >= questions.length - 1 || !!quizState.activeStudent))}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Question
            </button>
          )}
        </div>

        {/* End Quiz Button */}
        {Boolean(isQuizStarted && !isQuizEnded) && (
          <button
            onClick={onEndQuiz}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            End Quiz
          </button>
        )}

        {/* Reset Scores Button */}
        {isQuizEnded && (
          <button
            onClick={onResetScores}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset Scores
          </button>
        )}
      </div>
    </div>
  );
}
