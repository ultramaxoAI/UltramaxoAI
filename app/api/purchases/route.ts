import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createPurchaseRequest,
  getUserById,
  listPurchaseRequestsByUserId,
} from "@/lib/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purchases = await listPurchaseRequestsByUserId(session.user.id);
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("API Error (purchases/GET):", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
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
    const {
      planId,
      months = 1,
      price = 0,
      method = "manual",
      note,
    } = body || {};

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const [dbUser] = await getUserById(session.user.id);

    const purchase = await createPurchaseRequest({
      userId: session.user.id,
      username: dbUser?.name,
      email: dbUser?.email,
      planId,
      months,
      price,
      method,
      note,
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error("API Error (purchases/POST):", error);
    return NextResponse.json(
      { error: "Failed to create purchase request" },
      { status: 500 }
    );
  }
}
