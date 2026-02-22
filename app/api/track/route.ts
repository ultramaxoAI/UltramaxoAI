import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { logPageVisit } from "@/lib/db/queries";

export async function POST(request: Request) {
	try {
		const { path } = await request.json();

		if (!path) {
			return NextResponse.json({ error: "Missing path" }, { status: 400 });
		}

		// Get IP address from headers, standard in Vercel deployments
		const forwardedFor = request.headers.get("x-forwarded-for");
		const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

		// Hash the IP address for privacy so we don't store raw PII
		const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

		await logPageVisit(path, ipHash);

		return NextResponse.json({ success: true });
	} catch (error) {
		// Fail silently so we don't block the user's UI if tracking fails
		console.error("Error tracking visit:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
