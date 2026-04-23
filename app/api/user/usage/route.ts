import { auth } from "@/app/(auth)/auth";
import { getUserUsageOverview } from "@backend/db/queries";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const usage = await getUserUsageOverview({ userId: session.user.id });

	return Response.json({ usage }, { status: 200 });
}
