import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({
	path: ".env.local",
});

const runMigrate = async () => {
	if (!process.env.POSTGRES_URL) {
		console.log("⏭️  POSTGRES_URL not defined, skipping migrations");
		process.exit(0);
	}

	const url = new URL(process.env.POSTGRES_URL);
	const originalHost = url.hostname;
	url.hostname = "18.215.6.120";

	const connection = postgres(url.toString(), {
		max: 1,
		prepare: false,
		ssl: { servername: originalHost, rejectUnauthorized: true },
	});
	const db = drizzle(connection);

	console.log("⏳ Running manual migration...");

	try {
        await connection`
            CREATE TABLE IF NOT EXISTS "inbox_message" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "messageId" text NOT NULL,
                "fromEmail" text NOT NULL,
                "fromName" text,
                "toEmail" text NOT NULL,
                "subject" text,
                "textBody" text,
                "htmlBody" text,
                "status" varchar DEFAULT 'unread' NOT NULL,
                "threadId" text,
                "replyToMessageId" text,
                "receivedAt" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "inbox_message_messageId_unique" UNIQUE("messageId")
            );
        `;
        console.log("✅ Success!");
    } catch(err) {
        console.error("❌ Failed:", err);
    }

	process.exit(0);
};

runMigrate();
