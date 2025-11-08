import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';
import { RowDataPacket } from 'mysql2';

interface ScoreEvent extends RowDataPacket {
  student_name: string;
  score: number;
  created_at: Date;
}

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  let connection;

  try {
    connection = await getConnection();

    // Get all raw score events for the session
    const [scoreEvents] = await connection.execute<ScoreEvent[]>(`
      SELECT
          s.name as student_name,
          sqs.score,
          sqs.created_at
      FROM student_question_scores sqs
      JOIN students s ON sqs.student_id = s.student_id
      WHERE sqs.session_id = ?
      ORDER BY sqs.created_at;
    `, [sessionId]);

    const studentNames = [...new Set(scoreEvents.map(e => e.student_name))];
    const studentScores: Record<string, number> = {};
    studentNames.forEach(name => studentScores[name] = 0);

    const scoresOverTime = scoreEvents.map(event => {
      studentScores[event.student_name] += event.score;
      return {
        time: new Date(event.created_at).toLocaleTimeString(),
        ...studentScores
      };
    });

    // Query for question-by-question breakdown (for the table)
    const [breakdownRows] = await connection.execute(`
      SELECT
        q.text AS question_text,
        SUM(sqs.score) AS score_for_question,
        MIN(sqs.created_at) AS answered_at
      FROM student_question_scores sqs
      JOIN questions_bank q ON sqs.question_id = q.id
      WHERE sqs.session_id = ?
      GROUP BY sqs.question_id, q.text
      ORDER BY answered_at;
    `, [sessionId]);

    const questionBreakdown = (breakdownRows as any[]).map(row => ({
      question_text: row.question_text,
      score_for_question: row.score_for_question,
      answered_at: new Date(row.answered_at).toLocaleString(),
    }));

    return successResponse({ scoresOverTime, students: studentNames, questionBreakdown }, 'Session scores and breakdown fetched successfully');
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
