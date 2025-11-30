import { getConnection } from '@/utils/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

interface TotalGroupsResult {
  total_groups: number;
}

export async function GET() {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    connection = await getConnection();
    
    let query = 'SELECT COUNT(*) as total_groups FROM departments';
    const params: (string | number)[] = [];
    
    // Organizers only see their own groups
    if (session.role === 'organizer') {
      query += ' WHERE created_by = ?';
      params.push(session.userId);
    }
    
    const [rows] = await connection.execute(query, params);
    const totalGroups = (rows as unknown as TotalGroupsResult[])[0].total_groups;
    return NextResponse.json({ total_groups: totalGroups });
  } catch (error) {
    console.error('Error fetching total groups:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
