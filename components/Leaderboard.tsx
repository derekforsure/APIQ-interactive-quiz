import React from 'react';

interface LeaderboardProps {
  scores: Record<string, number>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  const sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

  return (
    <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 animate-fade-in">
      <h2 className="text-6xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 animate-pulse">
        Leaderboard
      </h2>
      <div className="space-y-6">
        {sortedScores.map(([name, score], index) => (
          <div
            key={name}
            className={`flex items-center justify-between p-6 rounded-2xl shadow-lg transform transition-all duration-300
              ${index === 0 ? 'bg-gradient-to-r from-yellow-300 to-amber-500 text-gray-900 scale-105' :
               index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 scale-100' :
               index === 2 ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white scale-95' :
               'bg-white/5 text-white'}
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center">
              <span className="text-4xl font-extrabold w-16 text-center">{index + 1}.</span>
              <span className="text-4xl font-semibold ml-4">{name}</span>
            </div>
            <span className="text-4xl font-bold">{score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
