import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Force refresh the user session
 * This endpoint can be called after upgrade approval to refresh session immediately
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // The auth() call will trigger JWT callback which fetches fresh data from DB
    return NextResponse.json({ 
      success: true, 
      user: session.user 
    });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 });
  }
}
