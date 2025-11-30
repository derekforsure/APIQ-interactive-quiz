import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { z } from 'zod';
import { getSession } from '@/lib/session';

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
});

export async function GET(request: Request) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    connection = await getConnection();
    
    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];
    
    // Organizers only see their own groups
    if (session.role === 'organizer') {
      whereClauses.push('d.created_by = ?');
      params.push(session.userId);
    }
    
    const whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM departments d${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as unknown as { total: number }[])[0].total;
    
    // Get paginated data
    const dataQuery = `SELECT d.id, d.name, COUNT(s.id) as student_count 
                       FROM departments d 
                       LEFT JOIN students s ON d.id = s.department_id${whereClause}
                       GROUP BY d.id, d.name 
                       ORDER BY d.name 
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
    }, 'Groups fetched successfully');
  } catch (error) {
    console.error('Error fetching groups:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(req: Request) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const validationResult = groupSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'Validation Error',
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { name } = validationResult.data;

    connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO departments (name, created_by) VALUES (?, ?)',
      [name, session.userId]
    );

    return successResponse({ message: 'Group added successfully', result }, 'Group added successfully', 201);
  } catch (error) {
    console.error('Error adding group:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
