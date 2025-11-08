import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function GET() {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT d.name, COUNT(s.id) as student_count
      FROM departments d
      LEFT JOIN students s ON d.id = s.department_id
      GROUP BY d.name
    `);
    return successResponse(rows, 'Student count by department fetched successfully');
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
