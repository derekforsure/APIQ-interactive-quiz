import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';

export async function GET() {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    connection = await getConnection();
    
    let query = `SELECT category, COUNT(*) as count 
       FROM questions_bank 
       WHERE is_active = 1`;
    const params: (string | number)[] = [];
    
    // Organizers only see their own questions
    if (session.role === 'organizer') {
      query += ' AND created_by = ?';
      params.push(session.userId);
    }
    
    query += ' GROUP BY category ORDER BY count DESC';
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
