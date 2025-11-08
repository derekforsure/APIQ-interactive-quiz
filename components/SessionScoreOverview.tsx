'use client';

import { useEffect, useState } from 'react';
import SessionScoresChart from './SessionScoresChart';
import SessionScoreBreakdownTable from './SessionScoreBreakdownTable';

interface ScoreData {
  time: string;
  score: number;
}

interface QuestionBreakdownData {
  question_text: string;
  score_for_question: number;
  answered_at: string;
}

interface SessionScoreOverviewProps {
  sessionId: string;
}

const SessionScoreOverview = ({ sessionId }: SessionScoreOverviewProps) => {
  const [scoresOverTime, setScoresOverTime] = useState<ScoreData[]>([]);
  const [questionBreakdown, setQuestionBreakdown] = useState<QuestionBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/scores-over-time`);
        const result = await res.json();
        if (result.success) {
          setScoresOverTime(result.data.scoresOverTime);
          setQuestionBreakdown(result.data.questionBreakdown);
        } else {
          setError(result.message || 'Failed to fetch session score data');
        }
      } catch (err) {
        console.error('Failed to fetch session score data:', err);
        setError('Failed to fetch session score data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading session score overview...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <SessionScoresChart sessionId={sessionId} scoresOverTime={scoresOverTime} />
      <SessionScoreBreakdownTable questionBreakdown={questionBreakdown} />
    </div>
  );
};

export default SessionScoreOverview;
