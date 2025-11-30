import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    connection = await getConnection();

    // Check if username or email exists
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM admins WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Username or Email already exists' }, { status: 409 });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      `INSERT INTO admins (username, email, password, verification_token, is_verified) 
       VALUES (?, ?, ?, ?, 0)`,
      [username, email, hashedPassword, verificationToken]
    );

    // Send Email (Mocking it for now)
    const verificationLink = `${req.nextUrl.origin}/verify?token=${verificationToken}`;
    console.log(`
      ---------------------------------------------------
      📧 SENDING VERIFICATION EMAIL TO: ${email}
      🔗 LINK: ${verificationLink}
      ---------------------------------------------------
    `);

    // In a real app, you would use nodemailer/resend here:
    // await sendEmail(email, verificationLink);

    return NextResponse.json({ message: 'Signup successful. Please check your email to verify.' });

  } catch (error) {
    console.error('Signup error:', error);
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
