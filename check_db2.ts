import { config } from "dotenv";

config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function check() {
	try {
		const sql = postgres(process.env.POSTGRES_URL as string);
		const db = drizzle(sql);

		const res = await sql`SELECT * FROM user_api_keys`;
		console.log("KEYS IN DB:", res.length);
		console.log(res);

		const res2 =
			await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_api_keys'`;
		console.log("COLUMNS:");
		console.log(res2);
	} catch (err) {
		console.log("DB ERROR:", err);
	}
	process.exit(0);
}

check();
