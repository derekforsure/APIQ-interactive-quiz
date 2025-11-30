import { getConnection } from '@/utils/db';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { getSession } from '@/lib/session';

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
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    connection = await getConnection();
    
    // Build WHERE clauses
    const whereClauses: string[] = ['is_active = 1'];
    const params: (string | number)[] = [];
    
    // Organizers only see their own questions
    if (session.role === 'organizer') {
      whereClauses.push('created_by = ?');
      params.push(session.userId);
    }
    
    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    
    const whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM questions_bank${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as unknown as { total: number }[])[0].total;
    
    // Get paginated data
    const dataQuery = `SELECT * FROM questions_bank${whereClause} 
                       ORDER BY created_at DESC 
                       LIMIT ${limit} OFFSET ${offset}`;
    
    const [rows] = await connection.execute(dataQuery, params);
    
    return successResponse({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Questions fetched successfully');
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
    const session = await getSession();
    if (!session || !session.userId) {
      return errorResponse('Unauthorized', 401);
    }

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
      'INSERT INTO questions_bank (text, answer, incorrect_option_1, incorrect_option_2, incorrect_option_3, category, difficulty, topic, question_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [text, answer, incorrect_option_1, incorrect_option_2, incorrect_option_3, category, difficulty, topic, question_type, session.userId]
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