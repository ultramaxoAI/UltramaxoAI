import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET() {
  const vars = {
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    postgresUrlStart: process.env.POSTGRES_URL
      ? `${process.env.POSTGRES_URL.substring(0, 15)}...`
      : "N/A",
    hasAuthSecret: !!process.env.AUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL is missing from Environment Variables");
    }

    // Attempt direct connection with explicit settings
    const sql = postgres(process.env.POSTGRES_URL, {
      prepare: false,
      ssl: "require",
      max: 1,
    });

    // Simple query to test connection
    const result = await sql`SELECT 1 as connected`;

    return NextResponse.json({
      status: "success",
      message: "Database connected successfully!",
      result: result[0],
      env_check: vars,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
        env_check: vars,
        hint: "If error is 'Tenant or user not found', it means the Database URL/Pass is wrong or Project is Paused.",
      },
      { status: 500 }
    );
  }
}
