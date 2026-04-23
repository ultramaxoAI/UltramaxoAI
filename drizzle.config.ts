import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
	path: ".env.local",
});

export default defineConfig({
	schema: "./backend/db/schema.ts",
	out: "./backend/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint: Forbidden non-null assertion.
		url: process.env.POSTGRES_URL_NON_POOLING!,
	},
});
