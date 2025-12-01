import { getConnection } from '@/utils/db';
import { NextRequest } from 'next/server';

interface AuditLogParams {
  userId: number;
  username?: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  details?: Record<string, unknown>;
  req?: NextRequest | Request;
}

/**
 * Log an audit event to the database
 * @param params - Audit log parameters
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  const {
    userId,
    username,
    action,
    entityType,
    entityId,
    details,
    req
  } = params;

  let connection;
  try {
    connection = await getConnection();

    // Extract IP and user agent from request if provided
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Get IP address
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      ipAddress = forwarded?.split(',')[0] || realIp || null;

      // Get user agent
      userAgent = req.headers.get('user-agent') || null;
    }

    // Insert audit log
    await connection.execute(
      `INSERT INTO audit_logs 
       (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username || null,
        action,
        entityType || null,
        entityId?.toString() || null,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to log audit event:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  // Authentication
  LOGIN: 'user.login',
  LOGOUT: 'user.logout',
  LOGIN_FAILED: 'user.login_failed',
  
  // Students
  STUDENT_CREATE: 'student.create',
  STUDENT_UPDATE: 'student.update',
  STUDENT_DELETE: 'student.delete',
  STUDENT_ACTIVATE: 'student.activate',
  STUDENT_DEACTIVATE: 'student.deactivate',
  
  // Questions
  QUESTION_CREATE: 'question.create',
  QUESTION_UPDATE: 'question.update',
  QUESTION_DELETE: 'question.delete',
  
  // Sessions
  SESSION_CREATE: 'session.create',
  SESSION_UPDATE: 'session.update',
  SESSION_DELETE: 'session.delete',
  SESSION_START: 'session.start',
  SESSION_END: 'session.end',
  
  // Groups
  GROUP_CREATE: 'group.create',
  GROUP_UPDATE: 'group.update',
  GROUP_DELETE: 'group.delete',
} as const;

/**
 * Entity types
 */
export const EntityTypes = {
  USER: 'user',
  STUDENT: 'student',
  QUESTION: 'question',
  SESSION: 'session',
  GROUP: 'group',
} as const;
