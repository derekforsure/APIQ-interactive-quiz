import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  let connection;

  try {
    connection = await getConnection();

    // This query calculates the cumulative score over time for a session.
    // It joins session_questions with student_question_scores to track progress.
    const [rows] = await connection.execute(`
      SELECT
        t.answered_at,
        SUM(t.score) OVER (ORDER BY t.answered_at) as cumulative_score
      FROM (
        SELECT
          MIN(sqs.created_at) as answered_at,
          sqs.question_id,
          SUM(sqs.score) as score
        FROM student_question_scores sqs
        WHERE sqs.session_id = ?
        GROUP BY sqs.question_id
      ) as t
      ORDER BY t.answered_at;
    `, [sessionId]);

    // The query returns multiple rows for each student's answer to the same question,
    // so we need to aggregate them into a single timeline.
    const scoresOverTime = (rows as any[]).map(row => ({
      time: new Date(row.answered_at).toLocaleTimeString(),
      score: row.cumulative_score,
    }));

    return successResponse({ scoresOverTime }, 'Session scores over time fetched successfully');
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
