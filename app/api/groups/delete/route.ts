import { getConnection } from '@/utils/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await request.json();
    if (!id) {
      return errorResponse('Group ID is required', 400);
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
        return errorResponse('Forbidden - You can only delete your own groups', 403);
      }
    }

    await connection.execute('DELETE FROM departments WHERE id = ?', [id]);
    
    return successResponse({}, 'Group deleted successfully');
  } catch (error) {
    console.error('Error deleting group:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
