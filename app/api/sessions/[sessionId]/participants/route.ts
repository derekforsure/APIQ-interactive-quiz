import { getConnection } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

interface Participant extends RowDataPacket {
  student_id: string;
  name: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { message: "Session ID is required" },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await getConnection();
    const [participants] = await connection.execute<Participant[]>(
      `SELECT s.student_id, s.name
       FROM students s
       JOIN session_participants sp ON s.student_id = sp.student_id
       WHERE sp.session_id = ?`,
      [sessionId]
    );

    return NextResponse.json(participants);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error", error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
