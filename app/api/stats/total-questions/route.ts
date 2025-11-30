import { getConnection } from "@/utils/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

interface TotalQuestionsResult {
  total_questions: number;
}

export async function GET() {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    connection = await getConnection();
    
    let query = "SELECT COUNT(*) as total_questions FROM questions_bank WHERE is_active = 1";
    const params: (string | number)[] = [];
    
    // Organizers only see their own questions
    if (session.role === 'organizer') {
      query += ' AND created_by = ?';
      params.push(session.userId);
    }
    
    const [rows] = (await connection.execute(query, params)) as [TotalQuestionsResult[], unknown];
    const total_questions = rows[0].total_questions;
    return NextResponse.json({ total_questions });
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
