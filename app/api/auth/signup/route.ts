import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

// Simple password hashing (in production use bcrypt/argon2)
// For this demo we'll keep it simple or assume the existing auth uses plain/simple hash
// NOTE: The existing schema implies passwords are stored. We should ideally hash them.
// I will use a placeholder hash function for now to match likely existing patterns or just store as is if that's the legacy state, 
// but for a new feature I'll assume we want at least some basic security.
// However, since I don't see bcrypt in package.json, I'll stick to a simple approach or just store it (NOT RECOMMENDED for prod, but matches context if no auth lib exists).
// actually, let's check if we can use crypto for a basic hash.

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
    const hashedPassword = hashPassword(password);

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
