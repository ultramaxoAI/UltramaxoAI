import { compare } from "bcrypt-ts";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/app/(auth)/auth";
import { getUserById, updateUserPassword } from "@/lib/db/queries";

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

		const { password, ...userWithoutPassword } = users[0];
		return NextResponse.json({ user: userWithoutPassword });
	} catch (error) {
		console.error("API Error (user/settings/GET):", error);
		return NextResponse.json(
			{ error: "Internal server error" },
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
		const { currentPassword, newPassword } = body;

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

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (user/settings/PATCH):", error);
		return NextResponse.json(
			{ error: "Gagal memperbarui password" },
			{ status: 500 },
		);
	}
}
