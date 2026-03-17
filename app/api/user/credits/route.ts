import { auth } from "@/app/(auth)/auth";
import { CREDIT_COSTS, getCreditResetWindowDays, getStartingCredits } from "@/lib/credits";
import { getCreditSummaryByUserId } from "@/lib/db/queries";

export async function GET() {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const summary = await getCreditSummaryByUserId({ userId: session.user.id, limit: 20 });

	return Response.json(
		{
			account: summary.account,
			transactions: summary.transactions,
			costs: CREDIT_COSTS,
			policy: {
				allowance: getStartingCredits({
					isPro: session.user.type === "pro",
					role: session.user.role,
				}),
				resetWindowDays: getCreditResetWindowDays({
					isPro: session.user.type === "pro",
					role: session.user.role,
				}),
			},
		},
		{ status: 200 },
	);
}
