import { config } from "dotenv";

config({ path: ".env.local" });

import { db } from "./lib/db/queries";
import { userApiKeys } from "./lib/db/schema";

async function check() {
	try {
		const keys = await db.select().from(userApiKeys);
		console.log("KEYS IN DB:", keys.length);
		console.log(keys);
	} catch (err) {
		console.log("DB ERROR:", err);
	}
	process.exit(0);
}

check();
