import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { logger } from "@/lib/logger";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | undefined;

    // Upload image to Vercel Blob if provided
    if (imageFile && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`profile/${session.user.id}/${imageFile.name}`, imageFile, {
          access: "public",
        });
        imageUrl = blob.url;
      } catch (error) {
        logger.error("Failed to upload profile image", error);
      }
    }

    // Update user in database
    const updates: any = {};
    if (name) updates.name = name;
    if (imageUrl) updates.image = imageUrl;
    updates.updatedAt = new Date();

    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, session.user.id))
      .returning();

    logger.info("Profile updated", { userId: session.user.id });

    return NextResponse.json({
      name: updatedUser.name,
      image: updatedUser.image,
    });
  } catch (error) {
    logger.error("Profile update error", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
