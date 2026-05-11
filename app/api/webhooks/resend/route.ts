import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { inboxMessage } from "@/backend/db/schema";
import { headers } from "next/headers";

// Required to parse raw body if we want to verify signature,
// but for now, we'll assume standard JSON parsing.
export async function POST(req: Request) {
	try {
		const body = await req.json();

		// Resend Inbound Payload
		// https://resend.com/docs/dashboard/webhooks/inbound
		const { from, to, subject, text, html, messageId } = body;

		if (!messageId) {
			return NextResponse.json(
				{ error: "Invalid payload: missing messageId" },
				{ status: 400 },
			);
		}

		// Extract email from "Name <email@domain.com>" format
		const extractEmail = (str: string) => {
			const match = str.match(/<([^>]+)>/);
			return match ? match[1] : str;
		};
		const extractName = (str: string) => {
			const match = str.match(/^([^<]+)</);
			return match ? match[1].trim() : "";
		};

		const fromEmail = extractEmail(from || "");
		const fromName = extractName(from || "");
		const toEmail = Array.isArray(to) ? to[0] : extractEmail(to || "");

		// Save to Database
		await db.insert(inboxMessage).values({
			messageId: messageId,
			fromEmail: fromEmail,
			fromName: fromName || null,
			toEmail: toEmail,
			subject: subject || "No Subject",
			textBody: text || "",
			htmlBody: html || "",
			status: "unread",
			receivedAt: new Date(),
		}).onConflictDoNothing({ target: inboxMessage.messageId }); // Prevent duplicates

		console.log(`[Resend Webhook] Received email from ${fromEmail} with Subject: ${subject}`);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Resend Webhook Error]:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
