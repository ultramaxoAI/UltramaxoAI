import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { auth } from "@/app/(auth)/auth";
import {
	deleteUserById,
	listUsersWithChatCount,
	updateUserAdmin,
} from "@backend/db/queries";

export async function GET() {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const users = await listUsersWithChatCount();
		return NextResponse.json({ users });
	} catch (error) {
		console.error("API Error (admin/users/GET):", error);
		return NextResponse.json(
			{ error: "Failed to fetch users" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		// FIX #3: Whitelist field yang diizinkan (mencegah mass assignment)
		const ALLOWED_FIELDS = ["isPro", "proExpiresAt", "role", "limitCount", "creditBalance", "name", "email"];
		const safeUpdates: Record<string, unknown> = {};
		for (const field of ALLOWED_FIELDS) {
			if (body[field] !== undefined) {
				safeUpdates[field] = body[field];
			}
		}

		if (typeof safeUpdates.proExpiresAt === "string") {
			safeUpdates.proExpiresAt = new Date(safeUpdates.proExpiresAt as string);
		}

		if (Object.keys(safeUpdates).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields to update" },
				{ status: 400 },
			);
		}

		await updateUserAdmin(id, safeUpdates);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (admin/users/PATCH):", error);
		return NextResponse.json(
			{ error: "Gagal memperbarui user" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "Missing ID" }, { status: 400 });
		}

		await deleteUserById(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (admin/users/DELETE):", error);
		return NextResponse.json(
			{ error: "Gagal menghapus user" },
			{ status: 500 },
		);
	}
}
