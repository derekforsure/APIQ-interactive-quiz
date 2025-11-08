import React from 'react';

interface LeaderboardProps {
  scores: Record<string, number>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  const sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  const topThree = sortedScores.slice(0, 3);
  const remaining = sortedScores.slice(3);

  const getPodiumOrder = () => {
    if (topThree.length === 0) return [];
    if (topThree.length === 1) return [topThree[0]];
    if (topThree.length === 2) return [topThree[1], topThree[0]];
    return [topThree[1], topThree[0], topThree[2]]; // 2nd, 1st, 3rd
  };

  const podiumOrder = getPodiumOrder();

  const getMedalEmoji = (position: number) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return '';
  };

  const getPodiumHeight = (index: number) => {
    if (topThree.length === 1) return 'h-80';
    if (topThree.length === 2) {
      return index === 1 ? 'h-80' : 'h-64';
    }
    // Standard 3-person podium
    if (index === 1) return 'h-96'; // 1st place (center)
    if (index === 0) return 'h-72'; // 2nd place (left)
    return 'h-60'; // 3rd place (right)
  };

  const getPodiumColors = (index: number) => {
    if (topThree.length === 1 || (topThree.length === 2 && index === 1) || (topThree.length === 3 && index === 1)) {
      return 'from-yellow-400 via-yellow-500 to-amber-600 border-yellow-300';
    }
    if (topThree.length === 2 && index === 0) {
      return 'from-gray-300 via-gray-400 to-gray-500 border-gray-200';
    }
    if (topThree.length === 3 && index === 0) {
      return 'from-gray-300 via-gray-400 to-gray-500 border-gray-200';
    }
    return 'from-orange-600 via-orange-700 to-orange-800 border-orange-400';
  };

  const getActualPosition = (podiumIndex: number) => {
    if (topThree.length === 1) return 0;
    if (topThree.length === 2) return podiumIndex === 1 ? 0 : 1;
    // For 3 people: positions are [1, 0, 2] (2nd, 1st, 3rd)
    if (podiumIndex === 0) return 1;
    if (podiumIndex === 1) return 0;
    return 2;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-8 animate-fade-in">
      {/* Title */}
      <div className="text-center mb-16">
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 blur-3xl opacity-60 animate-pulse"></div>
          <h2 className="relative text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-2xl mb-4 tracking-tight">
            FINAL RESULTS
          </h2>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-400 to-yellow-400 rounded-full"></div>
          <p className="text-3xl font-bold text-yellow-300 uppercase tracking-widest">Winners</p>
          <div className="h-1 w-32 bg-gradient-to-l from-transparent via-yellow-400 to-yellow-400 rounded-full"></div>
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-8 mb-16 perspective-1000">
        {podiumOrder.map((entry, podiumIndex) => {
          const [name, score] = entry;
          const actualPosition = getActualPosition(podiumIndex);
          const height = getPodiumHeight(podiumIndex);
          const colors = getPodiumColors(podiumIndex);
          
          return (
            <div
              key={name}
              className="flex flex-col items-center animate-podium-rise"
              style={{ animationDelay: `${podiumIndex * 0.3}s` }}
            >
              {/* Player Card */}
              <div className="mb-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border-4 border-purple-500/50 shadow-2xl min-w-[280px]">
                  {/* Medal */}
                  <div className="text-7xl text-center mb-4 animate-bounce-slow">
                    {getMedalEmoji(actualPosition)}
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-3xl font-black text-center text-white mb-3 truncate">
                    {name}
                  </h3>
                  
                  {/* Score */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl py-4 px-6 text-center">
                    <div className="text-5xl font-black text-white tabular-nums">
                      {score}
                    </div>
                    <div className="text-sm font-bold text-purple-200 uppercase tracking-wider mt-1">
                      Points
                    </div>
                  </div>
                </div>
              </div>

              {/* Podium Block */}
              <div className={`${height} w-64 bg-gradient-to-b ${colors} rounded-t-3xl border-4 shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-105`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-shine animate-shine"></div>
                
                {/* Position Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-9xl font-black text-white/30 drop-shadow-lg">
                    {actualPosition + 1}
                  </div>
                </div>

                {/* Decorative lines */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/30"></div>
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/30"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining Players */}
      {remaining.length > 0 && (
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-8 text-purple-300 uppercase tracking-wide">
            Other Participants
          </h3>
          <div className="space-y-4">
            {remaining.map(([name, score], index) => (
              <div
                key={name}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border-2 border-purple-500/30 shadow-xl hover:border-purple-400/50 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{index + 4}</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{name}</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl">
                  <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes podium-rise {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-podium-rise {
          animation: podium-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .bg-shine {
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          width: 200%;
          height: 200%;
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;