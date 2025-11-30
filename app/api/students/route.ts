
import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('is_active'); // '1', '0', or 'all'
    const departmentId = searchParams.get('departmentId');
    const groupId = searchParams.get('groupId'); // Support both for now
    
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    connection = await getConnection();
    let query = 'SELECT s.id, s.student_id, s.name, d.name as department, s.image_url, s.is_active FROM students s JOIN departments d ON s.department_id = d.id';
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    // Organizers only see their own students
    if (session.role === 'organizer') {
      whereClauses.push('s.created_by = ?');
      params.push(session.userId);
    }

    if (isActiveParam === '1') {
      whereClauses.push('s.is_active = 1');
    } else if (isActiveParam === '0') {
      whereClauses.push('s.is_active = 0');
    }

    if (departmentId || groupId) {
      whereClauses.push('s.department_id = ?');
      params.push(departmentId || groupId || '');
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    query += ' ORDER BY s.id DESC';
    
    const [rows] = await connection.execute(query, params);
    return successResponse(rows, 'Students fetched successfully');
  } catch (error) {
    console.error('Error fetching students:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
