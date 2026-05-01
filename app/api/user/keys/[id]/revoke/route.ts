import { revokePlatformApiKey } from "@backend/db/queries";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const revoked = await revokePlatformApiKey(id, session.user.id);
		return NextResponse.json(revoked);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to revoke key" },
			{ status: 500 },
		);
	}
}
