import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";
import {
	sendCustomEmail,
	sendUpgradeReminderEmail,
	sendVerificationEmail,
} from "@/lib/email";

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session || !session.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { email, name, type, subject, message, recipientType } = body;

		// recipientType: 'single' | 'all' | 'pro' | 'free'
		const actualRecipientType = recipientType || "single";

		if (actualRecipientType === "single" && !email) {
			return NextResponse.json(
				{ error: "Email is required for single recipient" },
				{ status: 400 },
			);
		}

		if (!type) {
			return NextResponse.json(
				{ error: "Email type is required" },
				{ status: 400 },
			);
		}

		// Function to send email to a single user
		const sendToUser = async (targetEmail: string, targetName: string) => {
			if (type === "upgrade-reminder") {
				return await sendUpgradeReminderEmail(
					targetEmail,
					targetName || "User",
				);
			}
			if (type === "custom") {
				if (!subject || !message) {
					throw new Error("Subject and message required");
				}
				return await sendCustomEmail(targetEmail, subject, message);
			}
			if (type === "verification-test") {
				return await sendVerificationEmail(targetEmail, "123456"); // Test code
			}
			return false;
		};

		if (actualRecipientType === "single") {
			const success = await sendToUser(email, name);
			if (success) {
				return NextResponse.json({ success: true });
			}
			return NextResponse.json(
				{ error: "Failed to send email" },
				{ status: 500 },
			);
		}

		// BROADCAST LOGIC
		let users: (typeof user.$inferSelect)[] = [];
		if (actualRecipientType === "all") {
			users = await db.select().from(user);
		} else if (actualRecipientType === "pro") {
			users = await db.select().from(user).where(eq(user.isPro, true));
		} else if (actualRecipientType === "free") {
			users = await db.select().from(user).where(eq(user.isPro, false));
		} else {
			return NextResponse.json(
				{ error: "Invalid recipient type" },
				{ status: 400 },
			);
		}
		let sentCount = 0;
		let failCount = 0;

		// Helper to wait between sends - Resend limits to 2 req/second
		const sleep = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		// Loop and send with throttle to avoid Resend rate limit (2 req/sec)
		for (const u of users) {
			if (!u.email) {
				continue;
			}
			try {
				const result = await sendToUser(u.email, u.name || "User");
				if (result) {
					sentCount++;
				} else {
					failCount++;
				}
			} catch (e) {
				console.error(`Failed to send to ${u.email}`, e);
				failCount++;
			}
			// Wait 600ms between each send to stay under 2 req/sec limit
			await sleep(600);
		}

		return NextResponse.json({
			success: true,
			meta: {
				total: users.length,
				sent: sentCount,
				failed: failCount,
			},
		});
	} catch (error) {
		console.error("Error sending email:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
