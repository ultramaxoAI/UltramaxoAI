import { auth } from "@/app/(auth)/auth";
import {
	deleteChatById,
	getChatById,
	updateChatOrganizationById,
	updateChatTitleById,
	updateChatVisibilityById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:chat").toResponse();
	}

	const { id } = await params;
	const existingChat = await getChatById({ id });

	if (!existingChat || existingChat.userId !== session.user.id) {
		return new ChatSDKError("forbidden:chat").toResponse();
	}

	const body = await request.json();

	if (typeof body.title === "string") {
		await updateChatTitleById({ chatId: id, title: body.title.trim() });
	}

	if (body.visibility === "private" || body.visibility === "public") {
		await updateChatVisibilityById({ chatId: id, visibility: body.visibility });
	}

	if (
		typeof body.isPinned === "boolean" ||
		body.folder !== undefined ||
		Array.isArray(body.tags)
	) {
		await updateChatOrganizationById({
			chatId: id,
			userId: session.user.id,
			isPinned: body.isPinned,
			folder: body.folder,
			tags: Array.isArray(body.tags)
				? body.tags.filter((tag: unknown) => typeof tag === "string")
				: undefined,
		});
	}

	const updatedChat = await getChatById({ id });

	return Response.json({ chat: updatedChat }, { status: 200 });
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:chat").toResponse();
	}

	const { id } = await params;
	const existingChat = await getChatById({ id });

	if (!existingChat || existingChat.userId !== session.user.id) {
		return new ChatSDKError("forbidden:chat").toResponse();
	}

	const deletedChat = await deleteChatById({ id });

	return Response.json(deletedChat, { status: 200 });
}
