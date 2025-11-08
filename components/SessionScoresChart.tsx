'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreData {
  time: string;
  score: number;
}

interface SessionScoresChartProps {
  scoresOverTime: ScoreData[];
}

const SessionScoresChart = ({ scoresOverTime }: SessionScoresChartProps) => {
  if (!scoresOverTime || scoresOverTime.length === 0) {
    return (
      <Card>
        <CardHeader className="mb-5">
          <CardTitle>Session Score Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No score data available for this session yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="mb-5">
        <CardTitle>Session Score Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoresOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#8884d8" name="Cumulative Score" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SessionScoresChart;
