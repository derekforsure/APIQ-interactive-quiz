import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  let connection;

  try {
    connection = await getConnection();

    // Query for cumulative scores over time (for the chart)
    const [cumulativeRows] = await connection.execute(`
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

    const scoresOverTime = (cumulativeRows as any[]).map(row => ({
      time: new Date(row.answered_at).toLocaleTimeString(),
      score: row.cumulative_score,
    }));

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

    return successResponse({ scoresOverTime, questionBreakdown }, 'Session scores and breakdown fetched successfully');
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
