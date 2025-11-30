import { getConnection } from '@/utils/db';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

// Define a schema for the expected update input
const updateQuestionSchema = z.object({
  id: z.number().int().positive("Question ID is required"),
  text: z.string().min(1, "Question text cannot be empty").optional(),
  answer: z.string().min(1, "Answer cannot be empty").optional(),
  incorrect_option_1: z.string().optional().nullable().transform(e => e === "" ? null : e),
  incorrect_option_2: z.string().optional().nullable().transform(e => e === "" ? null : e),
  incorrect_option_3: z.string().optional().nullable().transform(e => e === "" ? null : e),
  category: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  topic: z.string().optional(),
  question_type: z.string().optional(),
}).strict().refine(data => Object.keys(data).length > 1, {
  message: "At least one field other than 'id' must be provided for update",
  path: ["_general"],
});

export async function PUT(req: Request) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    
    // Validate the request body against the schema
    const validationResult = updateQuestionSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 Bad Request with validation errors
      return errorResponse(
        'Validation Error',
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { id, ...updateData } = validationResult.data as z.infer<typeof updateQuestionSchema>;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields provided for update', 400);
    }

    connection = await getConnection();
    
    // Check ownership for organizers
    if (session.role === 'organizer') {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT created_by FROM questions_bank WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return errorResponse('Question not found', 404);
      }
      
      if (rows[0].created_by !== session.userId) {
        return errorResponse('Forbidden - You can only update your own questions', 403);
      }
    }
    
    const setClauses = Object.keys(updateData).map(key => `\`${key}\` = ?`).join(', ');
    const values = Object.values(updateData);

    const [result] = await connection.execute(
      `UPDATE questions_bank SET ${setClauses} WHERE id = ?`,
      [...values, id]
    );
    
    // Check if any row was actually updated
    if ((result as ResultSetHeader).affectedRows === 0) {
      return errorResponse('Question not found or no changes made', 404);
    }

    return successResponse({ message: 'Question updated successfully' }, 'Question updated successfully');
  } catch (error) {
    console.error('Error updating question:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}