import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { inboxMessage } from "@/backend/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const messages = await db.select().from(inboxMessage).orderBy(desc(inboxMessage.receivedAt));
        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error("Inbox GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, status } = await req.json();
        await db.update(inboxMessage).set({ status }).where(eq(inboxMessage.id, id));
        return NextResponse.json({ success: true });
    } catch(error) {
        console.error("Inbox PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
