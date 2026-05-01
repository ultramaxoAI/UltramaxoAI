import {
	getAgentRunsByUserId,
	updateAgentRunStatus,
} from "@backend/db/queries";
import { auth } from "@/app/(auth)/auth";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const runs = await getAgentRunsByUserId({ userId: session.user.id });

	return Response.json({ runs }, { status: 200 });
}

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();

	if (!body.runId || !body.status) {
		return Response.json(
			{ error: "runId and status are required" },
			{ status: 400 },
		);
	}

	const run = await updateAgentRunStatus({
		runId: body.runId,
		userId: session.user.id,
		status: body.status,
	});

	return Response.json({ run }, { status: 200 });
}
