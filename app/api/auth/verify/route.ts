import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ message: 'Missing token' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();

    // Find user with token
    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT id, email FROM admins WHERE verification_token = ? AND is_verified = 0',
      [token]
    );

    if (users.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    const user = users[0];

    // Activate user and give 7-day trial
    await connection.execute(
      `UPDATE admins 
       SET is_verified = 1, 
           verification_token = NULL,
           subscription_status = 'trialing',
           subscription_plan = 'pro',
           trial_started_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return NextResponse.json({ message: 'Email verified successfully. You have been granted a 7-day free trial!' });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
