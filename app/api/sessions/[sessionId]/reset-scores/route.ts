import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: { sessionId: string } },
) {
  const { sessionId } = await context.params;
  let connection;

  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Delete scores from related tables
    await connection.execute('DELETE FROM student_question_scores WHERE session_id = ?', [sessionId]);
    await connection.execute('DELETE FROM student_scores WHERE session_id = ?', [sessionId]);
    await connection.execute('DELETE FROM department_scores WHERE session_id = ?', [sessionId]);

    await connection.commit();

    return successResponse({}, 'Scores for the session have been reset successfully.');
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error resetting session scores:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
