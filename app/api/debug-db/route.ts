import { db } from "@/lib/db/queries";
import { account } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempting to simulate NextAuth linking account for user
    await db.insert(account).values({
      userId: '47e3bd00-3346-47b8-9399-55f2e2224800', // ultramax user id
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'test-fake-account-id',
      access_token: 'fake',
      id_token: 'fake',
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
