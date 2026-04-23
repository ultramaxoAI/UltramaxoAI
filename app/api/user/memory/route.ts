import { auth } from "@/app/(auth)/auth";
import {
	createUserMemory,
	deleteUserMemoryById,
	getUserMemoryByUserId,
	updateUserMemoryById,
} from "@backend/db/queries";

type MemoryCategory = "profile" | "coding" | "product" | "instruction";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const memories = await getUserMemoryByUserId({ userId: session.user.id });

	return Response.json({ memories }, { status: 200 });
}

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.title?.trim() || !body.content?.trim()) {
		return Response.json(
			{ error: "Title and content are required" },
			{ status: 400 },
		);
	}

	const memory = await createUserMemory({
		userId: session.user.id,
		category: ((body.category as MemoryCategory) || "instruction") as MemoryCategory,
		title: body.title.trim(),
		content: body.content.trim(),
		isEnabled: body.isEnabled,
		isPinned: body.isPinned,
	});

	return Response.json({ memory }, { status: 200 });
}

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.id) {
		return Response.json({ error: "Memory id is required" }, { status: 400 });
	}

	const memory = await updateUserMemoryById({
		id: body.id,
		userId: session.user.id,
		category: body.category,
		title: body.title,
		content: body.content,
		isEnabled: body.isEnabled,
		isPinned: body.isPinned,
	});

	return Response.json({ memory }, { status: 200 });
}

export async function DELETE(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json({ error: "Memory id is required" }, { status: 400 });
	}

	const memory = await deleteUserMemoryById({ id, userId: session.user.id });

	return Response.json({ memory }, { status: 200 });
}
