import { auth } from "@/app/(auth)/auth";
import { getPlatformApiKeysByUserId, createPlatformApiKey } from "@backend/db/queries";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const keys = await getPlatformApiKeysByUserId(session.user.id);
		return NextResponse.json(keys);
	} catch (error) {
		return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { name } = await req.json();
		const key = `ux_sk_${nanoid(32)}`;
		
		const newKey = await createPlatformApiKey({
			userId: session.user.id,
			name: name || "Default Key",
			key,
		});

		return NextResponse.json(newKey);
	} catch (error) {
		return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
	}
}
