import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createVoucher } from "@/lib/db/queries";

export async function POST(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const { code, type, value, durationMonths } = body;

	if (!code || !type) {
		return NextResponse.json(
			{ error: "Code (code) and Type (type) are required" },
			{ status: 400 },
		);
	}

	const result = await createVoucher({ code, type, value, durationMonths });
	if (result.error) {
		return NextResponse.json({ error: result.error }, { status: 400 });
	}

	return NextResponse.json(result);
}
