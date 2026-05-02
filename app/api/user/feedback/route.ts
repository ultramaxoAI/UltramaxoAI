import { createUserFeedback } from "@backend/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as {
			message?: string;
			source?: "timed_prompt";
		};

		const message = String(body?.message ?? "").trim();
		const source = body?.source ?? "timed_prompt";

		if (!message) {
			return NextResponse.json(
				{ error: "Feedback message is required" },
				{ status: 400 },
			);
		}

		if (source !== "timed_prompt") {
			return NextResponse.json(
				{ error: "Unsupported feedback source" },
				{ status: 400 },
			);
		}

		const feedback = await createUserFeedback({
			userId: session.user.id,
			message,
			source,
		});

		return NextResponse.json({ success: true, feedback });
	} catch (error) {
		console.error("API Error (user/feedback/POST):", error);

		if (error instanceof ChatSDKError) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Failed to submit feedback" },
			{ status: 500 },
		);
	}
}
