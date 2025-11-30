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

    connection = await getConnection();
    
    let query = `SELECT 
      s.id, 
      s.name, 
      s.created_at, 
      s.is_active,
      COUNT(DISTINCT sp.student_id) AS participant_count,
      COUNT(DISTINCT sq.question_id) AS question_count
     FROM sessions s
     LEFT JOIN session_participants sp ON s.id = sp.session_id
     LEFT JOIN session_questions sq ON s.id = sq.session_id`;
    
    const params: (string | number)[] = [];
    
    // Organizers only see their own sessions
    if (sessionData.role === 'organizer') {
      query += ' WHERE s.created_by = ?';
      params.push(sessionData.userId);
    }
    
    query += ' GROUP BY s.id, s.name, s.created_at, s.is_active ORDER BY s.created_at DESC';
    
    if (limit && !isNaN(parseInt(limit))) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const [rows] = await connection.execute(query, params);
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