import { createVoucher, db } from "@backend/db/queries";
import { redeemCode } from "@backend/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const codes = await db
			.select()
			.from(redeemCode)
			.orderBy(desc(redeemCode.createdAt));

		return NextResponse.json({ codes });
	} catch (error) {
		console.error("API Error (admin/redeem-codes/GET):", error);
		return NextResponse.json(
			{ error: "Failed to fetch redeem codes" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { code, type, value, durationMonths, expiresAt } = body || {};

		if (!code || !type) {
			return NextResponse.json(
				{ error: "Missing code or type" },
				{ status: 400 },
			);
		}

		const normCode = String(code).trim().toUpperCase();
		if (!/^[A-Z0-9_-]{3,32}$/.test(normCode)) {
			return NextResponse.json(
				{
					error:
						"Kode voucher tidak valid. Gunakan A-Z, 0-9, _ atau - (3-32 chars).",
				},
				{ status: 400 },
			);
		}

		const normalizedType = type === "LIMIT" ? "CREDIT" : type;
		if (!["PRO", "CREDIT"].includes(normalizedType)) {
			return NextResponse.json(
				{ error: "Tipe voucher harus PRO atau CREDIT" },
				{ status: 400 },
			);
		}

		let expiresAtDate: Date | null = null;
		if (expiresAt) {
			const d = new Date(expiresAt);
			if (Number.isNaN(d.getTime())) {
				return NextResponse.json(
					{ error: "expiresAt tidak valid" },
					{ status: 400 },
				);
			}
			expiresAtDate = d;
		}

		const result = await createVoucher({
			code: normCode,
			type: normalizedType as "PRO" | "CREDIT",
			value: normalizedType === "CREDIT" ? Math.max(1, Number(value) || 1) : 0,
			durationMonths:
				normalizedType === "PRO" ? Math.max(1, Number(durationMonths) || 1) : 0,
			expiresAt: expiresAtDate,
		});

		if (result.error) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (admin/redeem-codes/POST):", error);
		return NextResponse.json(
			{ error: "Failed to create redeem code" },
			{ status: 500 },
		);
	}
}
