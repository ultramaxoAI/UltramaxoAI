import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRealtimeVisits, getVisitorInsights } from "@backend/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await auth();

		// Verify admin access
		if (session?.user?.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Fetch realtime traffic and auth visitor insights concurrently
		const [realtimeTraffic, authenticatedVisitors] = await Promise.all([
			getRealtimeVisits(),
			getVisitorInsights(),
		]);

		// Format the response
		return NextResponse.json({
			success: true,
			realtimeTraffic,
			authenticatedVisitors,
		});
	} catch (error) {
		console.error("API Error (admin/insights/GET):", error);
		return NextResponse.json(
			{ error: "Failed to fetch visitor insights" },
			{ status: 500 },
		);
	}
}
