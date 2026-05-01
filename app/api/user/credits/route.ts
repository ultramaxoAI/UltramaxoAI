import { getCreditSummaryByUserId } from "@backend/db/queries";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const summary = await getCreditSummaryByUserId({ userId: session.user.id });
		return NextResponse.json(summary);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to fetch credits" },
			{ status: 500 },
		);
	}
}
