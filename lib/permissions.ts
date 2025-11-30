import { getSession } from './session';
import { NextResponse } from 'next/server';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';
export type Resource = 'questions' | 'sessions' | 'students' | 'departments' | 'subscription' | 'settings';

/**
 * Check if the current user has permission to perform an action on a resource
 */
export async function checkPermission(
  action: PermissionAction,
  resource: Resource,
  resourceOwnerId?: number
): Promise<{ allowed: boolean; userId?: number; role?: string }> {
  const session = await getSession();

  if (!session || !session.userId || !session.role) {
    return { allowed: false };
  }

  const { userId, role } = session;

  // Admins can do anything
  if (role === 'admin') {
    return { allowed: true, userId, role };
  }

  // Organizers have limited permissions
  if (role === 'organizer') {
    // Cannot access subscription or settings
    if (resource === 'subscription' || resource === 'settings') {
      return { allowed: false, userId, role };
    }

    // For view and create, organizers can access
    if (action === 'view' || action === 'create') {
      return { allowed: true, userId, role };
    }

    // For edit and delete, check ownership
    if ((action === 'edit' || action === 'delete') && resourceOwnerId) {
      return { allowed: userId === resourceOwnerId, userId, role };
    }

    // Default deny for edit/delete without ownership check
    if (action === 'edit' || action === 'delete') {
      return { allowed: false, userId, role };
    }
  }

  return { allowed: false, userId, role };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return { session, userId: session.userId, role: session.role };
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin() {
  const session = await getSession();
  
  if (!session || !session.userId || session.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return { session, userId: session.userId };
}
