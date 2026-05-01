import { getApiCreditSummaryByUserId } from "@backend/db/queries";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const summary = await getApiCreditSummaryByUserId({
			userId: session.user.id,
		});
		return NextResponse.json(summary);
	} catch (error) {
		console.error("API credit summary error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch API credits" },
			{ status: 500 },
		);
	}
}
