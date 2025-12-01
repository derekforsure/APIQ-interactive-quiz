
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    connection = await getConnection();
    
    // Build WHERE clauses
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

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

    const whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM students s${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as unknown as { total: number }[])[0].total;
    
    // Get paginated data
    const dataQuery = `SELECT s.id, s.student_id, s.name, d.name as department, s.image_url, s.is_active 
                     FROM students s 
                     LEFT JOIN departments d ON s.department_id = d.id${whereClause}
                     ORDER BY s.id DESC 
                     LIMIT ${limit} OFFSET ${offset}`;
    
    const [rows] = await connection.execute(dataQuery, params);
    
    return successResponse({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Students fetched successfully');
  } catch (error) {
    console.error('Error fetching students:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
