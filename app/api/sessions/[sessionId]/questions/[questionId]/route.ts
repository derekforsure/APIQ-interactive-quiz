import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { ResultSetHeader } from 'mysql2';

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string, questionId: string }> }) {
  const { sessionId, questionId } = await params;
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute(
      'DELETE FROM session_questions WHERE session_id = ? AND question_id = ?',
      [sessionId, questionId]
    );

    if ((result as ResultSetHeader).affectedRows === 0) {
      return errorResponse('Question not found in this session', 404);
    }

    return successResponse({ message: 'Question removed from session successfully' }, 'Question removed from session successfully');
  } catch (error) {
    console.error('Error removing question from session:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
