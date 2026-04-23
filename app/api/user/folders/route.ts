import { auth } from "@/app/(auth)/auth";
import {
	createChatFolder,
	deleteChatFolder,
	getChatFoldersByUserId,
	renameChatFolder,
} from "@backend/db/queries";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const folders = await getChatFoldersByUserId({ userId: session.user.id });

	return Response.json({ folders }, { status: 200 });
}

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	if (!body.name?.trim()) {
		return Response.json({ error: "Folder name is required" }, { status: 400 });
	}

	const folder = await createChatFolder({
		userId: session.user.id,
		name: body.name,
	});

	return Response.json({ folder }, { status: 200 });
}

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	if (!body.previousName?.trim() || !body.nextName?.trim()) {
		return Response.json(
			{ error: "Previous and next folder names are required" },
			{ status: 400 },
		);
	}

	const folder = await renameChatFolder({
		userId: session.user.id,
		previousName: body.previousName,
		nextName: body.nextName,
	});

	return Response.json({ folder }, { status: 200 });
}

export async function DELETE(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const name = searchParams.get("name");

	if (!name?.trim()) {
		return Response.json({ error: "Folder name is required" }, { status: 400 });
	}

	const folder = await deleteChatFolder({ userId: session.user.id, name });

	return Response.json({ folder }, { status: 200 });
}
