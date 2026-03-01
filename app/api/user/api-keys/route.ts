import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/app/(auth)/auth";
import {
	deleteUserApiKey,
	getUserApiKeys,
	upsertUserApiKey,
} from "@/lib/db/queries-settings";
import { decryptData, encryptData, maskKey } from "@/lib/encryption";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const keys = await getUserApiKeys(session.user.id);
		const masked = keys.map((k) => {
			let maskedKeys: string[] = [];
			if (k.keysEncrypted) {
				try {
					const decrypted = decryptData(k.keysEncrypted);
					const parsed = JSON.parse(decrypted) as string[];
					maskedKeys = parsed.map((key) => maskKey(key));
				} catch {
					maskedKeys = ["(decryption error)"];
				}
			}
			return {
				id: k.id,
				provider: k.provider,
				isEnabled: k.isEnabled,
				customModels: k.customModels || [],
				maskedKeys,
				keyCount: maskedKeys.length,
			};
		});
		return NextResponse.json({ keys: masked });
	} catch (error) {
		console.error("API Error (api-keys/GET):", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { provider, keys, customModels } = body as {
			provider: string;
			keys: string[];
			customModels?: string[];
		};

		if (!provider) {
			return NextResponse.json(
				{ error: "Provider is required" },
				{ status: 400 },
			);
		}

		const validKeys = keys.filter(
			(k: string) => typeof k === "string" && k.trim().length > 0,
		);

		const encrypted =
			validKeys.length > 0 ? encryptData(JSON.stringify(validKeys)) : null;

		await upsertUserApiKey(session.user.id, provider, {
			keysEncrypted: encrypted,
			isEnabled: validKeys.length > 0,
			customModels: customModels || [],
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		require("fs").writeFileSync(
			"api-error.log",
			String(error) + "\n" + (error.stack || ""),
		);
		console.error("API Error (api-keys/POST):", error);
		return NextResponse.json(
			{ error: "Failed to save API key", details: String(error) },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { provider, isEnabled, customModels } = body as {
			provider: string;
			isEnabled?: boolean;
			customModels?: string[];
		};

		if (!provider) {
			return NextResponse.json(
				{ error: "Provider is required" },
				{ status: 400 },
			);
		}

		const updateData: {
			isEnabled?: boolean;
			customModels?: string[];
		} = {};

		if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
		if (customModels !== undefined) updateData.customModels = customModels;

		await upsertUserApiKey(session.user.id, provider, updateData);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		require("fs").writeFileSync(
			"api-error.log",
			String(error) + "\n" + (error.stack || ""),
		);
		console.error("API Error (api-keys/PATCH):", error);
		return NextResponse.json(
			{ error: "Failed to update", details: String(error) },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const provider = searchParams.get("provider");

		if (!provider) {
			return NextResponse.json(
				{ error: "Provider is required" },
				{ status: 400 },
			);
		}

		await deleteUserApiKey(session.user.id, provider);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (api-keys/DELETE):", error);
		return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
	}
}
