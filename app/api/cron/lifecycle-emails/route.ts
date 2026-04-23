import { NextResponse } from "next/server";
import { db } from "@backend/db/queries";
import { user } from "@backend/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { sendProExpiringEmail, sendProExpiredEmail } from "@backend/email";

export async function GET(request: Request) {
	// Verify Vercel Cron authentication (bearer CRON_SECRET)
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;

	// In development, bypass if CRON_SECRET is not set.
	// In production, Vercel sends the secret automatically.
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// 1. Process users expiring in exactly 3 days
		const expiringUsers = await db
			.select()
			.from(user)
			.where(
				and(
					eq(user.isPro, true),
					isNotNull(user.proExpiresAt),
					sql`DATE(${user.proExpiresAt}) = CURRENT_DATE + INTERVAL '3 days'`
				)
			);

		for (const u of expiringUsers) {
			if (u.email) {
				await sendProExpiringEmail(u.email, u.name || "User");
				console.info(`[CRON] Sent expiring email to ${u.email}`);
			}
		}

		// 2. Process users who have officially expired (expiry is today or in the past)
		const expiredUsers = await db
			.select()
			.from(user)
			.where(
				and(
					eq(user.isPro, true),
					isNotNull(user.proExpiresAt),
					sql`DATE(${user.proExpiresAt}) <= CURRENT_DATE`
				)
			);

		for (const u of expiredUsers) {
			// Downgrade to free tier
			await db
				.update(user)
				.set({ isPro: false })
				.where(eq(user.id, u.id));

			if (u.email) {
				await sendProExpiredEmail(u.email, u.name || "User");
				console.info(`[CRON] Sent expired email to ${u.email} and downgraded to free`);
			}
		}

		return NextResponse.json({
			success: true,
			expiringProcessed: expiringUsers.length,
			expiredProcessed: expiredUsers.length,
		});
	} catch (error) {
		console.error("[CRON] Lifecycle emails error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
