import { getConnection } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: { sessionId: string } }
) {
  const { sessionId } = context.params;
  const { student_id } = await req.json();

  if (!sessionId || !student_id) {
    return NextResponse.json(
      { message: "Session ID and Student ID are required" },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.execute(
      "DELETE FROM session_participants WHERE session_id = ? AND student_id = ?",
      [sessionId, student_id]
    );

    return NextResponse.json({ message: "Participant removed successfully" });
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
