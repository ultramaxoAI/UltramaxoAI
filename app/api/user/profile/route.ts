import { db } from "@backend/db/queries";
import { user } from "@backend/db/schema";
import { validateImage } from "@backend/file-validation";
import { logger } from "@backend/logger";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function PATCH(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const name = String(formData.get("name") ?? "").trim();
		const imageFile = formData.get("image") as File | null;

		let imageUrl: string | undefined;

		if (name.length > 80) {
			return NextResponse.json({ error: "Name is too long" }, { status: 400 });
		}

		// Upload image to Vercel Blob if provided
		if (imageFile && process.env.BLOB_READ_WRITE_TOKEN) {
			const validation = validateImage(imageFile);
			if (!validation.valid) {
				return NextResponse.json(
					{ error: validation.error || "Invalid image" },
					{ status: 400 },
				);
			}

			try {
				const safeFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
				const blob = await put(
					`profile/${session.user.id}/${safeFilename}`,
					imageFile,
					{
						access: "public",
					},
				);
				imageUrl = blob.url;
			} catch (error) {
				logger.error("Failed to upload profile image", error);
			}
		}

		const updates: Partial<typeof user.$inferInsert> = {};
		updates.name = name || null;
		if (imageUrl) {
			updates.image = imageUrl;
		}
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
			{ status: 500 },
		);
	}
}
