import React from 'react';

interface QuizCountdownProps {
  countdown: number | null;
}

export function QuizCountdown({ countdown }: QuizCountdownProps) {
  if (countdown === null) return null;

  return (
    <div className="absolute top-4 left-4 z-40 animate-in">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg border-4 border-white">
        {countdown > 0 ? (
          <>
            <p className="text-white text-xs font-semibold mb-1">STARTING IN</p>
            <span className="text-5xl font-bold text-white">{countdown}</span>
          </>
        ) : (
          <p className="text-white text-lg font-bold animate-bounce">STARTED!</p>
        )}
      </div>
    </div>
  );
}
