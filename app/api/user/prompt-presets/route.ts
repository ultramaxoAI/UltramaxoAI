import { auth } from "@/app/(auth)/auth";
import {
	createPromptPreset,
	deletePromptPresetById,
	getPromptPresetsByUserId,
	updatePromptPresetById,
} from "@/lib/db/queries";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const presets = await getPromptPresetsByUserId({ userId: session.user.id });

	return Response.json({ presets }, { status: 200 });
}

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.title?.trim() || !body.prompt?.trim()) {
		return Response.json(
			{ error: "Title and prompt are required" },
			{ status: 400 },
		);
	}

	const preset = await createPromptPreset({
		userId: session.user.id,
		title: body.title.trim(),
		prompt: body.prompt.trim(),
		modelId: body.modelId?.trim() || null,
		visibility: body.visibility === "public" ? "public" : "private",
		webSearchEnabled: body.webSearchEnabled,
		deepThinkingEnabled: body.deepThinkingEnabled,
		fullstackModeEnabled: body.fullstackModeEnabled,
		mobileModeEnabled: body.mobileModeEnabled,
	});

	return Response.json({ preset }, { status: 200 });
}

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.id) {
		return Response.json({ error: "Preset id is required" }, { status: 400 });
	}

	const preset = await updatePromptPresetById({
		id: body.id,
		userId: session.user.id,
		title: body.title,
		prompt: body.prompt,
		modelId: body.modelId,
		visibility: body.visibility,
		webSearchEnabled: body.webSearchEnabled,
		deepThinkingEnabled: body.deepThinkingEnabled,
		fullstackModeEnabled: body.fullstackModeEnabled,
		mobileModeEnabled: body.mobileModeEnabled,
	});

	return Response.json({ preset }, { status: 200 });
}

export async function DELETE(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return Response.json({ error: "Preset id is required" }, { status: 400 });
	}

	const preset = await deletePromptPresetById({ id, userId: session.user.id });

	return Response.json({ preset }, { status: 200 });
}
