import { getConnection } from "@/utils/db";
import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { setSession } from "@/lib/session";
import { randomBytes } from "crypto";
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

// Define a schema for the expected login input
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    
    // Validate the request body against the schema
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'Validation Error',
        400,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { username, password } = validationResult.data;

    connection = await getConnection();
    const [rows] = (await connection.execute(
      `SELECT id, username, password, subscription_status, trial_started_at, role 
       FROM admins WHERE username = ?`,
      [username]
    )) as [{ id: number; username: string; password: string; subscription_status: string; trial_started_at: Date | null; role: string }[], unknown];

    if (rows.length === 0) {
      return errorResponse("Invalid username or password", 401);
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return errorResponse("Invalid username or password", 401);
    }

    // Check if trial has expired (only for organizers with trials)
    if (user.role === 'organizer' && user.subscription_status !== 'active' && user.trial_started_at) {
      const trialStart = new Date(user.trial_started_at);
      const now = new Date();
      const daysSinceTrialStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceTrialStart >= 7) {
        return errorResponse("Your 7-day trial has expired. Please subscribe to continue using the platform.", 403);
      }
    }

    const sessionId = randomBytes(16).toString("hex");
    await setSession({ 
      sessionId, 
      isAdmin: true, 
      username: user.username,
      role: user.role,
      userId: user.id
    });

    return successResponse({ message: "Login successful" }, "Login successful");
  } catch (error) {
    console.error("Error during login:", error);
    return errorResponse("Internal server error", 500);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}