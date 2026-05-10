import { compare } from "bcrypt-ts";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { getUserById, updateUserPassword } from "@backend/db/queries";
import { auth } from "@/app/(auth)/auth";
import {
	isSafeFirstPartyMutation,
	NO_STORE_HEADERS,
} from "@/lib/auth-mutation-security";

const FORBIDDEN_USER_SETTING_FIELDS = new Set([
	"id",
	"role",
	"isPro",
	"limitCount",
	"creditBalance",
	"proExpiresAt",
	"emailVerified",
	"password",
]);

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const users = await getUserById(session.user.id);
		if (!users || users.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const currentUser = users[0];
		return NextResponse.json(
			{
				user: {
					id: currentUser.id,
					name: currentUser.name,
					email: currentUser.email,
					role: currentUser.role,
					isPro: currentUser.isPro,
					createdAt: currentUser.createdAt,
				},
			},
			{ headers: NO_STORE_HEADERS },
		);
	} catch (error) {
		console.error("API Error (user/settings/GET):", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	if (!isSafeFirstPartyMutation(request)) {
		return NextResponse.json(
			{ error: "Forbidden" },
			{ headers: NO_STORE_HEADERS, status: 403 },
		);
	}

	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const forbiddenField = Object.keys(body).find((key) =>
			FORBIDDEN_USER_SETTING_FIELDS.has(key),
		);
		if (forbiddenField) {
			return NextResponse.json(
				{ error: "Field tidak boleh diubah dari endpoint settings" },
				{ headers: NO_STORE_HEADERS, status: 400 },
			);
		}

		const { currentPassword, newPassword } = body;
		if (
			typeof currentPassword !== "string" ||
			typeof newPassword !== "string" ||
			newPassword.length < 8 ||
			newPassword.length > 128
		) {
			return NextResponse.json(
				{ error: "Password baru minimal 8 karakter" },
				{ headers: NO_STORE_HEADERS, status: 400 },
			);
		}

		const users = await getUserById(session.user.id);
		if (!users || users.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const user = users[0];

		if (!user.password) {
			return NextResponse.json(
				{ error: "Akun ini tidak memiliki password (login via Google/GitHub)" },
				{ status: 400 },
			);
		}

		// Check current password
		const isPasswordValid = await compare(currentPassword, user.password);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: "Password saat ini salah" },
				{ status: 400 },
			);
		}

		await updateUserPassword(session.user.id, newPassword);

		return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
	} catch (error) {
		console.error("API Error (user/settings/PATCH):", error);
		return NextResponse.json(
			{ error: "Gagal memperbarui password" },
			{ status: 500 },
		);
	}
}
