import { NextResponse } from "next/server";

/**
 * Health check endpoint for monitoring
 * Returns system status and basic metrics
 */
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "unknown",
    checks: {
      database: await checkDatabase(),
      ai: checkAI(),
      storage: checkStorage(),
    },
  };

  const allHealthy = Object.values(health.checks).every((check) => check.status === "ok");

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}

async function checkDatabase() {
  try {
    // Simple check if database connection env exists
    if (!process.env.POSTGRES_URL) {
      return { status: "error", message: "Database not configured" };
    }
    return { status: "ok" };
  } catch (error) {
    return { status: "error", message: "Database check failed" };
  }
}

function checkAI() {
  const hasKey = Boolean(
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY_1 ||
    process.env.GROQ_API_KEY_2
  );
  
  if (!hasKey) {
    return { status: "error", message: "AI provider not configured" };
  }
  
  return { status: "ok" };
}

function checkStorage() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { status: "warning", message: "Storage not configured (optional)" };
  }
  
  return { status: "ok" };
}
