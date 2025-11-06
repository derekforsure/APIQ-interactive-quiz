import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

interface Question {
  id: number;
  text: string;
  answer: string;
  category: string;
  difficulty: number;
  topic: string;
  question_type: string;
  options: string | null;
  created_at: string;
  is_active: number;
}

interface DBError extends Error {
  code?: string;
}

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  let connection;
  try {
    const { sessionId } = await params;
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT qb.*
       FROM session_questions sq
       JOIN questions_bank qb ON sq.question_id = qb.id
       WHERE sq.session_id = ?`,
      [sessionId]
    );
    return successResponse(rows as Question[], 'Session questions fetched successfully');
  } catch (error) {
    console.error('Error fetching session questions:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

const addQuestionToSessionSchema = z.object({
  question_id: z.number().int().positive(),
});

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  let connection;
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const validationResult = addQuestionToSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse('Validation Error', 400, validationResult.error.flatten().fieldErrors);
    }

    const { question_id } = validationResult.data;

    connection = await getConnection();
    await connection.execute(
      'INSERT INTO session_questions (session_id, question_id) VALUES (?, ?)',
      [sessionId, question_id]
    );

    return successResponse({ message: 'Question added to session successfully' }, 'Question added to session successfully', 201);
  } catch (error) {
    console.error('Error adding question to session:', error);
    // Handle unique constraint violation
    if ((error as DBError).code === 'ER_DUP_ENTRY') {
      return errorResponse('This question has already been added to the session.', 409);
    }
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
