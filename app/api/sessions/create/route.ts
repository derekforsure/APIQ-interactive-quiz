import { getConnection } from "@/utils/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { randomBytes } from "crypto";
import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
});

export async function POST(req: Request) {
  const sessionData = await getSession();
  const isAdmin = sessionData?.isAdmin;

  if (!isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let connection;
  let name = "";
  try {
    const body = await req.json();
    const validationResult = createSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation Error",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    name = validationResult.data.name;

    connection = await getConnection();
    const sessionId = randomBytes(16).toString("hex");
    await connection.execute("INSERT INTO sessions (id, name, created_by) VALUES (?, ?, ?)", [
      sessionId,
      name,
      sessionData.userId,
    ]);

    return NextResponse.json({ sessionId, name });
  } catch (error: unknown) {
    console.error(error);
    if (error && typeof error === 'object' && 'code' in error && error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          message: `Duplicate entry: A session with the name '${name}' already exists.`,
        },
        { status: 409 }
      );
    }
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