import React from 'react';
import { QuizState } from '@/hooks/useQuizSocket';

interface QuizLiveStatusProps {
  quizState: QuizState | null;
  onJudgeAnswer: (correct: boolean) => void;
}

export function QuizLiveStatus({ quizState, onJudgeAnswer }: QuizLiveStatusProps) {
  const isQuizEnded = quizState?.isQuizEnded;

  return (
    <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Live Status</h3>
      </div>
      <div className="p-5">
        {quizState ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Timer</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{(quizState.remainingTime / 1000).toFixed(1)}</p>
                  <span className="text-sm text-gray-500">seconds</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Buzzer Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${quizState.isBuzzerActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className={`text-sm font-medium ${quizState.isBuzzerActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {quizState.isBuzzerActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">Active Participant</span>
              <div className="mb-4">
                {quizState.activeStudent ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-indigo-900">{quizState.activeStudent}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onJudgeAnswer(true)}
                  disabled={Boolean(quizState.activeStudent === null || isQuizEnded)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Correct
                </button>
                <button
                  onClick={() => onJudgeAnswer(false)}
                  disabled={Boolean(quizState.activeStudent === null || isQuizEnded)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Incorrect
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-3">Ineligible Participants</span>
              {quizState.ineligibleStudents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {quizState.ineligibleStudents.map((student) => (
                    <span key={student} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      {student}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">None</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-sm text-gray-500">Establishing connection...</p>
          </div>
        )}
      </div>
    </div>
  );
}
