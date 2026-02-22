import { auth } from "@/app/(auth)/auth";
import { getDashboardStats } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await auth();
		if (!session?.user || session.user.role !== "admin") {
			return new Response("Unauthorized", { status: 401 });
		}

		const stats = await getDashboardStats();
		return Response.json(stats);
	} catch (error) {
		console.error("Admin Stats API Error:", error);
		return Response.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
