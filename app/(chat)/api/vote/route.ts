import {
	getChatById,
	getMessageById,
	getVotesByChatId,
	voteMessage,
} from "@backend/db/queries";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";

function isUuid(value: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		value,
	);
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const chatId = searchParams.get("chatId");

	if (!chatId) {
		return Response.json([], { status: 200 });
	}

	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:vote").toResponse();
	}

	const chat = await getChatById({ id: chatId });

	if (!chat) {
		return new ChatSDKError("not_found:chat").toResponse();
	}

	if (chat.userId !== session.user.id) {
		return new ChatSDKError("forbidden:vote").toResponse();
	}

	try {
		const votes = await getVotesByChatId({ id: chatId });
		return Response.json(votes, { status: 200 });
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

export async function PATCH(request: Request) {
	const {
		chatId,
		messageId,
		type,
	}: { chatId: string; messageId: string; type: "up" | "down" } =
		await request.json();

	if (!chatId || !messageId || !type) {
		return new ChatSDKError(
			"bad_request:api",
			"Parameters chatId, messageId, and type are required.",
		).toResponse();
	}

	if (!isUuid(chatId) || !isUuid(messageId)) {
		return Response.json({ skipped: true }, { status: 200 });
	}

	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:vote").toResponse();
	}

	const chat = await getChatById({ id: chatId });

	if (!chat) {
		return new ChatSDKError("not_found:vote").toResponse();
	}

	if (chat.userId !== session.user.id) {
		return new ChatSDKError("forbidden:vote").toResponse();
	}

	try {
		const [targetMessage] = await getMessageById({ id: messageId });
		if (!targetMessage || targetMessage.chatId !== chatId) {
			return Response.json({ skipped: true }, { status: 200 });
		}

		await voteMessage({
			chatId,
			messageId,
			type,
		});

		return new Response("Message voted", { status: 200 });
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
