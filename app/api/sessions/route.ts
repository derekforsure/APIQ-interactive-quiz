import { getConnection } from "@/utils/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const sessionData = await getSession();
  const isAdmin = sessionData?.isAdmin;

  if (!isAdmin || !sessionData?.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const page = parseInt(searchParams.get('page') || '1');
    const pageLimit = limit ? parseInt(limit) : parseInt(searchParams.get('pageLimit') || '10');
    const offset = (page - 1) * pageLimit;

    connection = await getConnection();
    
    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];
    
    // Organizers only see their own sessions
    if (sessionData.role === 'organizer') {
      whereClauses.push('s.created_by = ?');
      params.push(sessionData.userId);
    }
    
    const whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT s.id) as total FROM sessions s${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as unknown as { total: number }[])[0].total;
    
    // Get paginated data
    let query = `SELECT 
      s.id, 
      s.name, 
      s.created_at, 
      s.is_active,
      COUNT(DISTINCT sp.student_id) AS participant_count,
      COUNT(DISTINCT sq.question_id) AS question_count
     FROM sessions s
     LEFT JOIN session_participants sp ON s.id = sp.session_id
     LEFT JOIN session_questions sq ON s.id = sq.session_id${whereClause}
     GROUP BY s.id, s.name, s.created_at, s.is_active 
     ORDER BY s.created_at DESC`;
    
    // Only apply pagination if not using the old 'limit' parameter for backward compatibility
    if (!limit) {
      query += ` LIMIT ${pageLimit} OFFSET ${offset}`;
    } else if (!isNaN(parseInt(limit))) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const [rows] = await connection.execute(query, params);
    
    // Return with pagination info if using new pagination
    if (!limit) {
      return NextResponse.json({ 
        data: rows,
        pagination: {
          page,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit)
        }
      });
    }
    
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}