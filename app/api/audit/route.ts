import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getSession } from '@/lib/session';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const session = await getSession();
    
    // Check if user is authenticated
    if (!session || !session.userId) {
      console.error('Audit log access denied: No session or userId');
      return errorResponse('Unauthorized', 401);
    }

    // Only admins can view audit logs (organizers can only see their own in future)
    if (session.role !== 'admin') {
      console.error('Audit log access denied: User role is', session.role);
      return errorResponse('Forbidden - Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;
    
    // Filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    connection = await getConnection();
    
    // Build WHERE clauses
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (userId) {
      whereClauses.push('user_id = ?');
      params.push(parseInt(userId));
    }

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (entityType) {
      whereClauses.push('entity_type = ?');
      params.push(entityType);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as unknown as { total: number }[])[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        id, user_id, username, action, entity_type, entity_id, 
        details, ip_address, user_agent, created_at
      FROM audit_logs${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(dataQuery, params);

    // Parse JSON details field if it's a string, otherwise use as is (mysql2 might auto-parse JSON columns)
    const logs = (rows as any[]).map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));

    return successResponse({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Audit logs fetched successfully');
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
