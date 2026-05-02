import {
	listUserFeedback,
	updateUserFeedbackStatus,
	type FeedbackStatus,
} from "@backend/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const ALLOWED_STATUSES = new Set<FeedbackStatus>(["new", "reviewed"]);

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const feedback = await listUserFeedback();
		return NextResponse.json({ feedback });
	} catch (error) {
		console.error("API Error (admin/feedback/GET):", error);

		if (error instanceof ChatSDKError) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(
			{ error: "Failed to fetch feedback" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as {
			id?: string;
			status?: FeedbackStatus;
		};
		const id = String(body?.id ?? "").trim();
		const status = body?.status;

		if (!id) {
			return NextResponse.json(
				{ error: "Feedback ID is required" },
				{ status: 400 },
			);
		}

		if (!status || !ALLOWED_STATUSES.has(status)) {
			return NextResponse.json(
				{ error: "Invalid feedback status" },
				{ status: 400 },
			);
		}

		const feedback = await updateUserFeedbackStatus({ id, status });

		if (!feedback) {
			return NextResponse.json(
				{ error: "Feedback not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true, feedback });
	} catch (error) {
		console.error("API Error (admin/feedback/PATCH):", error);

		if (error instanceof ChatSDKError) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(
			{ error: "Failed to update feedback" },
			{ status: 500 },
		);
	}
}
