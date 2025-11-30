import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function PUT(request: NextRequest) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { id, name } = await request.json();
    if (!id || !name) {
      return errorResponse('Group ID and name are required', 400);
    }

    connection = await getConnection();
    
    // Check ownership for organizers
    if (session.role === 'organizer') {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT created_by FROM departments WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return errorResponse('Group not found', 404);
      }
      
      if (rows[0].created_by !== session.userId) {
        return errorResponse('Forbidden - You can only update your own groups', 403);
      }
    }

    const [result] = await connection.execute('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
    
    return successResponse(result, 'Group updated successfully');
  } catch (error) {
    console.error('Error updating group:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
