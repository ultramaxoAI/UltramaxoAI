import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteUserById,
  listUsersWithChatCount,
  updateUserAdmin,
} from "@/lib/db/queries";

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
      { status: 500 }
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await updateUserAdmin(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error (admin/users/PATCH):", error);
    return NextResponse.json(
      { error: "Gagal memperbarui user" },
      { status: 500 }
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
      { status: 500 }
    );
  }
}
