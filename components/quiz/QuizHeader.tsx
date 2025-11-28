import React from 'react';

interface QuizHeaderProps {
  isQuizEnded: boolean;
  isQuizStarted: boolean;
  scoringMode: 'individual' | 'department';
  onScoringModeChange: (mode: 'individual' | 'department') => void;
  onOpenPresentation: () => void;
}

export function QuizHeader({
  isQuizEnded,
  isQuizStarted,
  scoringMode,
  onScoringModeChange,
  onOpenPresentation,
}: QuizHeaderProps) {
  return (
    <div className="flex justify-between items-start pb-5 border-b border-gray-200">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Quiz Control Panel</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isQuizEnded ? 'Quiz Ended' : isQuizStarted ? 'In Progress' : 'Not Started'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mode:</span>
          <select
            value={scoringMode || 'individual'}
            onChange={(e) => onScoringModeChange(e.target.value as 'individual' | 'department')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={Boolean(isQuizStarted)}
          >
            <option value="individual">Individual</option>
            <option value="department">Department</option>
          </select>
        </div>
        <button
          onClick={onOpenPresentation}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Presentation
        </button>
      </div>
    </div>
  );
}
