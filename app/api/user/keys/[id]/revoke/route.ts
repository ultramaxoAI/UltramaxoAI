import { auth } from "@/app/(auth)/auth";
import { revokePlatformApiKey } from "@backend/db/queries";
import { NextResponse } from "next/server";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const revoked = await revokePlatformApiKey(id, session.user.id);
		return NextResponse.json(revoked);
	} catch (error) {
		return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
	}
}
