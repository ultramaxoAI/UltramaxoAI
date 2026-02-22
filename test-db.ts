import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
	"postgresql://neondb_owner:npg_sre0WpiPG6Lw@ep-billowing-wave-ahvlw81w-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
	console.log("Connecting to DB...");
	const client = postgres(connectionString, { prepare: false, ssl: "require" });

	try {
		const res = await client`SELECT 1`;
		console.log("DB Connection Success:", res);
	} catch (err) {
		console.error("DB Connection Error:", err);
	}
	process.exit(0);
}
main();
