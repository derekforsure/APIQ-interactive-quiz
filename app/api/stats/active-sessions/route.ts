import { getConnection } from "@/utils/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

interface ActiveSessionsResult {
  active_sessions: number;
}

export async function GET() {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    connection = await getConnection();
    
    let query = "SELECT COUNT(*) as active_sessions FROM sessions WHERE is_active = 1";
    const params: (string | number)[] = [];
    
    // Organizers only see their own sessions
    if (session.role === 'organizer') {
      query += ' AND created_by = ?';
      params.push(session.userId);
    }
    
    const [rows] = (await connection.execute(query, params)) as [ActiveSessionsResult[], unknown];
    const active_sessions = rows[0].active_sessions;
    return NextResponse.json({ active_sessions });
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
