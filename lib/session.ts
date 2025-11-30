import { cookies } from 'next/headers';
import IORedis from 'ioredis';

type SessionData = {
  sessionId?: string;
  isAdmin?: boolean;
  studentId?: string;
  quizSessionId?: string;
  username?: string;
  role?: string; // 'admin' or 'organizer'
  userId?: number; // Admin ID
};

const secret = process.env.SECRET_COOKIE_PASSWORD;

if (!secret) {
  throw new Error('SECRET_COOKIE_PASSWORD environment variable is not set. Please set it in your .env.local file.');
}

// Initialize Redis client
const redisClient = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});

const SESSION_NAME = 'quiz-app-session';
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 1 week

export async function getSession(): Promise<SessionData | null> {
  const sessionCookie = (await cookies()).get(SESSION_NAME);
  if (!sessionCookie) {
    return null;
  }

  const sessionId = sessionCookie.value;
  const sessionDataString = await redisClient.get(sessionId);

  if (!sessionDataString) {
    return null;
  }

  return JSON.parse(sessionDataString) as SessionData;
}

export async function setSession(data: SessionData) {
  const sessionId = data.sessionId;
  if (!sessionId) {
    throw new Error('Session ID is required to set session.');
  }

  // Store session data in Redis
  await redisClient.set(sessionId, JSON.stringify(data), 'EX', SESSION_EXPIRATION_SECONDS);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRATION_SECONDS,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_NAME);
  if (sessionCookie) {
    const sessionId = sessionCookie.value;
    await redisClient.del(sessionId);
    cookieStore.delete(SESSION_NAME);
  }
}
