import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({
	path: ".env.local",
});

async function main() {
	if (!process.env.POSTGRES_URL) {
		console.log("POSTGRES_URL not defined.");
		process.exit(1);
	}

	const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
	const _db = drizzle(connection);

	try {
		console.log("Adding freeIdeModeUsedAt column to user table...");
		await connection`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "freeIdeModeUsedAt" timestamp;`;
		console.log("Migration successful!");
		process.exit(0);
	} catch (err) {
		console.error("Migration failed:", err);
		process.exit(1);
	}
}

main();
