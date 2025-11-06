import { getConnection } from "@/utils/db";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { RowDataPacket } from "mysql2";

const submitAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.number(),
  answer: z.string(),
});

interface QuestionInfo extends RowDataPacket {
  answer: string;
}

interface StudentQuestionScore extends RowDataPacket {
  score: number;
}

export async function POST(request: Request) {
  let connection;
  try {
    const session = await getSession();
    if (!session || !session.studentId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validationResult = submitAnswerSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Validation Error",
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { sessionId, questionId, answer } = validationResult.data;
    const studentId = session.studentId;

    connection = await getConnection();

    // Get the correct answer
    const [questionRows] = await connection.execute<QuestionInfo[]>(
      "SELECT answer FROM questions_bank WHERE id = ?",
      [questionId]
    );

    if (questionRows.length === 0) {
      return errorResponse("Question not found", 404);
    }

    const { answer: correctAnswer } = questionRows[0];
    const newScoreForQuestion = answer === correctAnswer ? 9 : 0; // Changed from 10 to 9

    // Update or insert the student's score for the current question
    await connection.execute(
      `INSERT INTO student_question_scores (student_id, session_id, question_id, score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score)`,
      [studentId, sessionId, questionId, newScoreForQuestion]
    );

    // Recalculate total score for the student in the session
    const [totalScores] = await connection.execute<StudentQuestionScore[]>(
      "SELECT SUM(sqs.score) as score FROM student_question_scores sqs WHERE sqs.student_id = ? AND sqs.session_id = ?",
      [studentId, sessionId]
    );

    const totalScore = totalScores[0].score || 0;

    // Update or insert the student's total score
    await connection.execute(
      `INSERT INTO student_scores (student_id, session_id, score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score)`,
      [studentId, sessionId, totalScore]
    );

    // Get student's department_id
    const [studentDepartmentRows] = await connection.execute<RowDataPacket[]>(
      "SELECT department_id FROM students WHERE student_id = ?",
      [studentId]
    );

    if (studentDepartmentRows.length > 0 && studentDepartmentRows[0].department_id) {
      const departmentId = studentDepartmentRows[0].department_id;

      // Recalculate total score for the department in the session
      const [totalDepartmentScores] = await connection.execute<RowDataPacket[]>(
        `SELECT SUM(ss.score) as score
         FROM student_scores ss
         JOIN students s ON ss.student_id = s.student_id
         WHERE s.department_id = ? AND ss.session_id = ?`,
        [departmentId, sessionId]
      );

      const totalDepartmentScore = totalDepartmentScores[0].score || 0;

      // Update or insert the department's total score
      await connection.execute(
        `INSERT INTO department_scores (department_id, session_id, score)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [departmentId, sessionId, totalDepartmentScore]
      );
    }

    return successResponse(
      { correct: newScoreForQuestion > 0, score: newScoreForQuestion },
      "Answer submitted successfully"
    );
  } catch (error) {
    console.error("Error submitting answer:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}