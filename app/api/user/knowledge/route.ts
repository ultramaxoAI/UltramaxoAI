import { auth } from "@/app/(auth)/auth";
import {
	createUserKnowledgeEntry,
	deleteUserKnowledgeEntryById,
	getUserKnowledgeEntriesByUserId,
	updateUserKnowledgeEntryById,
} from "@backend/db/queries";

type KnowledgeCategory = "project" | "product" | "brand" | "reference";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const entries = await getUserKnowledgeEntriesByUserId({
		userId: session.user.id,
	});

	return Response.json({ entries }, { status: 200 });
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

	const entry = await createUserKnowledgeEntry({
		userId: session.user.id,
		category: ((body.category as KnowledgeCategory) || "project") as KnowledgeCategory,
		title: body.title.trim(),
		content: body.content.trim(),
		source: body.source?.trim() || null,
		workspace: body.workspace?.trim() || null,
		isEnabled: body.isEnabled,
		isPinned: body.isPinned,
	});

	return Response.json({ entry }, { status: 200 });
}

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.id) {
		return Response.json(
			{ error: "Knowledge entry id is required" },
			{ status: 400 },
		);
	}

	const entry = await updateUserKnowledgeEntryById({
		id: body.id,
		userId: session.user.id,
		category: body.category,
		title: body.title,
		content: body.content,
		source: body.source,
		workspace: body.workspace,
		isEnabled: body.isEnabled,
		isPinned: body.isPinned,
	});

	return Response.json({ entry }, { status: 200 });
}

export async function DELETE(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json(
			{ error: "Knowledge entry id is required" },
			{ status: 400 },
		);
	}

	const entry = await deleteUserKnowledgeEntryById({
		id,
		userId: session.user.id,
	});

	return Response.json({ entry }, { status: 200 });
}
