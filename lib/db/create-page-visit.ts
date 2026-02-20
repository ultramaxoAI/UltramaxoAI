import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

async function run() {
  const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, {
    ssl: "require",
  });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS page_visit (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        path text NOT NULL,
        "ipHash" text NOT NULL,
        "visitedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Table page_visit created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await sql.end();
  }
}

run();
