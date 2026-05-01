import { deleteAllChatsByUserId, getChatsByUserId } from "@backend/db/queries";
import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
	const startingAfter = searchParams.get("starting_after");
	const endingBefore = searchParams.get("ending_before");
	const searchQuery = searchParams.get("q");
	const visibility =
		(searchParams.get("visibility") as "all" | "private" | "public" | null) ??
		"all";
	const pinnedOnly = searchParams.get("pinned_only") === "true";
	const folder = searchParams.get("folder");

	if (startingAfter && endingBefore) {
		return new ChatSDKError(
			"bad_request:api",
			"Only one of starting_after or ending_before can be provided.",
		).toResponse();
	}

	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:chat").toResponse();
	}

	try {
		const chats = await getChatsByUserId({
			id: session.user.id,
			limit,
			startingAfter,
			endingBefore,
			searchQuery,
			visibility,
			pinnedOnly,
			folder,
		});

		return Response.json(chats);
	} catch (error) {
		if (error instanceof ChatSDKError) {
			return error.toResponse();
		}
		return Response.json(
			{ error: "An unexpected error occurred." },
			{ status: 500 },
		);
	}
}

export async function DELETE() {
	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:chat").toResponse();
	}

	const result = await deleteAllChatsByUserId({ userId: session.user.id });

	return Response.json(result, { status: 200 });
}
