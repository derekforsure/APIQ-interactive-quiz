
import { getConnection } from '@/utils/db';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

// Define a schema for the expected input
const deleteStudentSchema = z.object({
  id: z.number().int().positive("Student ID must be a positive integer"),
});

export async function POST(req: Request) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    
    // Validate the request body against the schema
    const validationResult = deleteStudentSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 Bad Request with validation errors
      return errorResponse(
        'Validation Error',
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { id } = validationResult.data;

    connection = await getConnection();
    
    // Check ownership for organizers
    if (session.role === 'organizer') {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT created_by FROM students WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return errorResponse('Student not found', 404);
      }
      
      if (rows[0].created_by !== session.userId) {
        return errorResponse('Forbidden - You can only delete your own students', 403);
      }
    }
    
    const [result] = await connection.execute('UPDATE students SET is_active = 0 WHERE id = ?', [id]);
    
    // Check if any row was actually deleted
    if ((result as ResultSetHeader).affectedRows === 0) {
      return errorResponse('Student not found', 404);
    }

    return successResponse({ message: 'Student deleted successfully' }, 'Student deleted successfully');
  } catch (error) {
    console.error('Error deleting student:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
