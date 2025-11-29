import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2';

interface Question extends RowDataPacket {
  id: number;
  text: string;
  answer: string;
  incorrect_option_1: string;
  incorrect_option_2: string;
  incorrect_option_3: string;
  category: string;
  difficulty: number;
  topic: string;
  question_type: string;
  created_at: string;
  is_active: number;
}

interface DBError extends Error {
  code?: string;
}

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute<Question[]>(
      `SELECT qb.*
       FROM session_questions sq
       JOIN questions_bank qb ON sq.question_id = qb.id
       WHERE sq.session_id = ?`,
      [sessionId]
    );
    return successResponse(rows, 'Session questions fetched successfully');
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

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  let connection;
  try {
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
