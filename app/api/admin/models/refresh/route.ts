import { refreshModelCatalog } from "@backend/models/model-catalog";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function POST() {
	const session = await auth();
	if (!session?.user?.id || session.user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await refreshModelCatalog();
		return NextResponse.json({ success: true, ...result });
	} catch (error) {
		console.error("Model refresh error:", error);
		return NextResponse.json(
			{ error: "Failed to refresh catalog" },
			{ status: 500 },
		);
	}
}
