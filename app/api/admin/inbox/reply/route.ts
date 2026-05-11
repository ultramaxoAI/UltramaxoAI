import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { inboxMessage } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
	try {
		const { id, toEmail, subject, textBody, htmlBody } = await req.json();

		if (!process.env.RESEND_API_KEY) {
			return NextResponse.json(
				{ error: "RESEND_API_KEY is not configured" },
				{ status: 500 },
			);
		}

		// Send email using Resend
		const data = await resend.emails.send({
			from: process.env.RESEND_FROM || "Ultramaxo Support <support@ultramaxo.tech>",
			to: toEmail,
			subject: subject,
			text: textBody,
			html: htmlBody || textBody.replace(/\n/g, "<br/>"),
		});

		if (data.error) {
			return NextResponse.json({ error: data.error.message }, { status: 400 });
		}

		// Mark the original message as replied
		await db
			.update(inboxMessage)
			.set({ status: "replied" })
			.where(eq(inboxMessage.id, id));

		return NextResponse.json({ success: true, data });
	} catch (error) {
		console.error("Inbox Reply Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
