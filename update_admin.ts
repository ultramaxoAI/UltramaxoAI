import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./backend/db/schema";
import { generateHashedPassword } from "./backend/db/utils";

dotenv.config({ path: ".env.local" });

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
	throw new Error("POSTGRES_URL must be set");
}

const client = postgres(postgresUrl, {
	prepare: false,
});
const db = drizzle(client, { schema });


async function updateAdmin() {
	try {
		const password = process.env.ADMIN_PASSWORD;
		const email = process.env.ADMIN_EMAIL;

		if (!password || !email) {
			throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
		}

		console.log("Updating admin password and role...");
		await db
			.update(schema.user)
			.set({
				username: "admin",
				password: generateHashedPassword(password),
				role: "admin",
				emailVerified: new Date(),
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
