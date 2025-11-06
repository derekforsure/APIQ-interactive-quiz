import { getConnection } from '@/utils/db';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// Define a schema for the expected question input
const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  answer: z.string().min(1, "Answer is required"),
  incorrect_option_1: z.string().optional().nullable().transform(e => e === "" ? null : e),
  incorrect_option_2: z.string().optional().nullable().transform(e => e === "" ? null : e),
  incorrect_option_3: z.string().optional().nullable().transform(e => e === "" ? null : e),
  category: z.string().default('General'),
  difficulty: z.number().int().min(1).max(5).default(1),
  topic: z.string().default('General'),
  question_type: z.string().default('text'),
});

export async function GET(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    connection = await getConnection();
    let query = 'SELECT * FROM questions_bank WHERE is_active = 1';
    const params: string[] = [];
    
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    return successResponse(rows, 'Questions fetched successfully');
  } catch (error) {
    console.error('Error fetching questions:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    
    // Validate the request body against the schema
    const validationResult = questionSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 Bad Request with validation errors
      return errorResponse(
        'Validation Error',
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { text, answer, incorrect_option_1, incorrect_option_2, incorrect_option_3, category, difficulty, topic, question_type } = validationResult.data;

    connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO questions_bank (text, answer, incorrect_option_1, incorrect_option_2, incorrect_option_3, category, difficulty, topic, question_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [text, answer, incorrect_option_1, incorrect_option_2, incorrect_option_3, category, difficulty, topic, question_type]
    );
    
    return successResponse({ message: 'Question added successfully', result }, 'Question added successfully', 201);
  } catch (error) {
    console.error('Error adding question:', error);
    return errorResponse('Internal server error', 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}