'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreData {
  time: string;
  [student: string]: number | string;
}

interface SessionScoresChartProps {
  scoresOverTime: ScoreData[];
  students: string[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57'];

const SessionScoresChart = ({ scoresOverTime, students }: SessionScoresChartProps) => {
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
        <CardTitle>Individual Student Scores Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoresOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {students.map((student, index) => (
              <Line
                key={student}
                type="monotone"
                dataKey={student}
                stroke={COLORS[index % COLORS.length]}
                name={student}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SessionScoresChart;
