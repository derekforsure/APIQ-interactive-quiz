import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  let connection;
  try {
    connection = await getConnection();
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT category, COUNT(*) as count 
       FROM questions_bank 
       WHERE is_active = 1 
       GROUP BY category 
       ORDER BY count DESC`
    );

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
