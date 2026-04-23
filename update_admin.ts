import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./backend/db/schema";
import * as dotenv from "dotenv";
import { generateHashedPassword } from "./backend/db/utils";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const url = new URL(process.env.POSTGRES_URL!);
const originalHost = url.hostname;
url.hostname = '18.215.6.120'; // Force IPv4

const client = postgres(url.toString(), { 
  ssl: { servername: originalHost, rejectUnauthorized: true }, 
  prepare: false 
});
const db = drizzle(client, { schema });

async function updateAdmin() {
  try {
    const password = "anakanjg12";
    const email = "admin@nexus.ai";

    console.log("Updating admin password and role...");
    await db.update(schema.user)
      .set({ 
          username: "admin",
          password: generateHashedPassword(password),
          role: "admin",
          emailVerified: new Date()
      })
      .where(eq(schema.user.email, email));
    console.log("Admin user updated successfully.");

  } catch (error) {
    console.error("DB Error:", error);
  } finally {
    await client.end();
  }
}

updateAdmin();
