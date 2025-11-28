import React from 'react';
import { QuizState } from '@/hooks/useQuizSocket';

interface QuizLeaderboardProps {
  quizState: QuizState | null;
  finalLeaderboardScores: Record<string, number> | null;
}

export function QuizLeaderboard({ quizState, finalLeaderboardScores }: QuizLeaderboardProps) {
  const isQuizEnded = quizState?.isQuizEnded;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {isQuizEnded ? 'Final Leaderboard' : 'Current Round Leaderboard'}
        </h3>
      </div>
      <div className="p-5">
        {(isQuizEnded && finalLeaderboardScores) ? (
          <div className="space-y-2">
            {Object.entries(finalLeaderboardScores)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([name, score], index) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{score}</span>
                </div>
              ))}
          </div>
        ) : (quizState && quizState.scores && Object.keys(quizState.scores).length > 0) ? (
          <div className="space-y-2">
            {Object.entries(quizState.scores)
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([name, score], index) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{score}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-gray-500 mt-2">No scores yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
