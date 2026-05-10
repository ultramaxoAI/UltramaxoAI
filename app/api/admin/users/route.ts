import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import {
	deleteUserById,
	listUsersWithChatCount,
	updateUserAdmin,
} from "@backend/db/queries";
import { auth } from "@/app/(auth)/auth";
import {
	isSafeFirstPartyMutation,
	NO_STORE_HEADERS,
} from "@/lib/auth-mutation-security";

const ALLOWED_ROLES = new Set(["user", "admin"]);

function normalizeAdminUpdates(body: Record<string, unknown>) {
	const safeUpdates: Record<string, unknown> = {};

	if (typeof body.isPro === "boolean") {
		safeUpdates.isPro = body.isPro;
	}

	if (typeof body.proExpiresAt === "string") {
		const date = new Date(body.proExpiresAt);
		if (Number.isNaN(date.getTime())) {
			throw new Error("Invalid proExpiresAt");
		}
		safeUpdates.proExpiresAt = date;
	}

	if (body.proExpiresAt === null) {
		safeUpdates.proExpiresAt = null;
	}

	if (typeof body.role === "string") {
		if (!ALLOWED_ROLES.has(body.role)) {
			throw new Error("Invalid role");
		}
		safeUpdates.role = body.role;
	}

	if (
		typeof body.limitCount === "number" &&
		Number.isInteger(body.limitCount)
	) {
		safeUpdates.limitCount = Math.max(0, body.limitCount);
	}

	if (
		typeof body.creditBalance === "number" &&
		Number.isFinite(body.creditBalance)
	) {
		safeUpdates.creditBalance = Math.max(0, body.creditBalance);
	}

	if (typeof body.name === "string") {
		const name = body.name.trim();
		if (name.length > 80) {
			throw new Error("Invalid name");
		}
		safeUpdates.name = name || null;
	}

	if (typeof body.email === "string") {
		const email = body.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			throw new Error("Invalid email");
		}
		safeUpdates.email = email;
	}

	return safeUpdates;
}

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
	if (!isSafeFirstPartyMutation(request)) {
		return NextResponse.json(
			{ error: "Forbidden" },
			{ headers: NO_STORE_HEADERS, status: 403 },
		);
	}

	const session = await auth();
	if (session?.user?.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const { id } = body;

		if (typeof id !== "string" || !id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		const safeUpdates = normalizeAdminUpdates(body);

		if (Object.keys(safeUpdates).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields to update" },
				{ status: 400 },
			);
		}

		await updateUserAdmin(id, safeUpdates);
		return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
	} catch (error) {
		console.error("API Error (admin/users/PATCH):", error);
		const message =
			error instanceof Error && error.message.startsWith("Invalid")
				? error.message
				: "Gagal memperbarui user";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function DELETE(request: Request) {
	if (!isSafeFirstPartyMutation(request)) {
		return NextResponse.json(
			{ error: "Forbidden" },
			{ headers: NO_STORE_HEADERS, status: 403 },
		);
	}

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
