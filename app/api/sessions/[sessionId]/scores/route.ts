import { getConnection } from "@/utils/db";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { RowDataPacket } from "mysql2";

interface ScoreResult extends RowDataPacket {
  name: string;
  score: number;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'individual'; // Default to individual

    if (!sessionId) {
      return errorResponse("Session ID is required", 400);
    }

    connection = await getConnection();
    let rows: ScoreResult[];

    if (mode === 'department') {
      [rows] = await connection.execute<ScoreResult[]>(
        `SELECT d.name as name, COALESCE(SUM(ds.score), 0) as score
         FROM departments d
         LEFT JOIN department_scores ds ON d.id = ds.department_id
         WHERE ds.session_id = ?
         GROUP BY d.name
         ORDER BY score DESC`,
        [sessionId]
      );
    } else { // individual mode or default
      [rows] = await connection.execute<ScoreResult[]>(
        `SELECT s.name as name, COALESCE(SUM(ss.score), 0) as score
         FROM students s
         LEFT JOIN student_scores ss ON s.student_id = ss.student_id
         WHERE ss.session_id = ?
         GROUP BY s.name
         ORDER BY score DESC`,
        [sessionId]
      );
    }

    return successResponse(rows, "Scores fetched successfully");
  } catch (error) {
    console.error("Error fetching scores:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}