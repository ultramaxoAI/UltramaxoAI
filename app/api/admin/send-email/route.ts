import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";
import {
  sendCustomEmail,
  sendUpgradeReminderEmail,
  sendVerificationEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, type, subject, message, recipientType } = body;

    // recipientType: 'single' | 'all' | 'pro' | 'free'
    const actualRecipientType = recipientType || "single";

    if (actualRecipientType === "single" && !email) {
      return NextResponse.json(
        { error: "Email is required for single recipient" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Email type is required" },
        { status: 400 }
      );
    }

    // Function to send email to a single user
    const sendToUser = async (targetEmail: string, targetName: string) => {
      if (type === "upgrade-reminder") {
        return await sendUpgradeReminderEmail(
          targetEmail,
          targetName || "User"
        );
      }
      if (type === "custom") {
        if (!subject || !message)
          throw new Error("Subject and message required");
        return await sendCustomEmail(targetEmail, subject, message);
      }
      if (type === "verification-test") {
        return await sendVerificationEmail(targetEmail, "123456"); // Test code
      }
      return false;
    };

    if (actualRecipientType === "single") {
      const success = await sendToUser(email, name);
      if (success) return NextResponse.json({ success: true });
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // BROADCAST LOGIC
    let query;
    if (actualRecipientType === "all") {
      query = db.select().from(user);
    } else if (actualRecipientType === "pro") {
      query = db.select().from(user).where(eq(user.isPro, true));
    } else if (actualRecipientType === "free") {
      query = db.select().from(user).where(eq(user.isPro, false));
    } else {
      return NextResponse.json(
        { error: "Invalid recipient type" },
        { status: 400 }
      );
    }

    const users = await query;
    let sentCount = 0;
    let failCount = 0;

    // Loop and send (Sequential to avoid rate limits for now, albeit slow)
    // In production, use a queue (BullMQ/Inngest)
    for (const u of users) {
      if (!u.email) continue;
      try {
        const result = await sendToUser(u.email, u.name || "User");
        if (result) sentCount++;
        else failCount++;
      } catch (e) {
        console.error(`Failed to send to ${u.email}`, e);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      meta: {
        total: users.length,
        sent: sentCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
