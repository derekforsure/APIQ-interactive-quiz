import { getConnection } from '@/utils/db';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { ResultSetHeader } from 'mysql2';

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
  round: z.number().int().min(1).optional(),
  topic: z.string().optional(),
  question_type: z.string().optional(),
  options: z.string().optional().nullable().transform(e => e === "" ? null : e).refine(val => {
    if (val === null) return true; // Null is allowed
    if (typeof val !== 'string') return false; // Only allow string
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Options must be a valid JSON string or null/empty string",
  }),
}).strict().refine(data => Object.keys(data).length > 1, {
  message: "At least one field other than 'id' must be provided for update",
  path: ["_general"],
});

export async function PUT(req: Request) {
  let connection;
  try {
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