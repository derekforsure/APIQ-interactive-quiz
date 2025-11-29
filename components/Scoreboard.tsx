'use client';

import { useEffect, useState, useCallback } from 'react';

interface Score {
  name: string;
  score: number;
}

interface ScoreboardProps {
  sessionId: string;
  scoringMode: 'individual' | 'department';
}

export default function Scoreboard({ sessionId, scoringMode }: ScoreboardProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sessions/${sessionId}/scores?mode=${scoringMode}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setScores(data.data || []);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch scores:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, scoringMode]);

  useEffect(() => {
    fetchScores();
  }, [sessionId, scoringMode, fetchScores]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-100 text-amber-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const sortedScores = (Array.isArray(scores) ? [...scores] : []).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Scoreboard</h3>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
          {scoringMode === 'individual' ? 'Individual' : 'Department'} Ranking
        </span>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading scores...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-red-600">Error: {error}</p>
          </div>
        ) : sortedScores.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No scores available yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {scoringMode === 'individual' ? 'Name' : 'Department'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedScores.map((score, index) => {
                const rank = index + 1;
                const rankIcon = getRankIcon(rank);
                
                return (
                  <tr 
                    key={score.name} 
                    className={`transition-colors ${rank <= 3 ? 'bg-gradient-to-r from-gray-50 to-white' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {rankIcon && <span className="text-lg">{rankIcon}</span>}
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${getRankBadge(rank)}`}>
                          {rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${rank <= 3 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {score.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-bold ${rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-gray-600' : rank === 3 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {score.score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}