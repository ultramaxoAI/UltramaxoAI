import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { purchaseRequest, user as userTable } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Check if user has any pending/approved upgrade requests
 * Used for polling to detect when admin approves upgrade
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get latest upgrade request for this user
    const [latestRequest] = await db
      .select()
      .from(purchaseRequest)
      .where(eq(purchaseRequest.userId, session.user.id))
      .orderBy(desc(purchaseRequest.createdAt))
      .limit(1);

    // Get fresh user data
    const [userData] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      isPro: userData?.isPro || false,
      latestRequest: latestRequest ? {
        id: latestRequest.id,
        status: latestRequest.status,
        planId: latestRequest.planId,
        createdAt: latestRequest.createdAt,
      } : null,
    });
  } catch (error) {
    console.error("Error checking upgrade status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
