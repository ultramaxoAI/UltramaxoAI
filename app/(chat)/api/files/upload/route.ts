import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

// Allow typical chatbot attachment file types
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "text/x-python",
  "application/x-python-code",
];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: "File size should be less than 20MB",
    })
    .refine(
      (file) =>
        allowedTypes.includes(file.type) ||
        file.type.startsWith("text/") ||
        (file as File).name?.endsWith(".py"), // allow common extensions easily
      {
        message: "File type is not supported",
      }
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const data = await put(filename, fileBuffer, {
          access: "public",
        });
        return NextResponse.json(data);
      }
      // Fallback to Base64 data URL if Vercel Blob is not configured
      console.warn(
        "BLOB_READ_WRITE_TOKEN not found, returning base64 data URL fallback"
      );

      const buffer = Buffer.from(fileBuffer);
      const base64Str = buffer.toString("base64");
      const mimeType = file.type || "application/octet-stream";
      const dataUrl = `data:${mimeType};base64,${base64Str}`;
      const crypto = await import("node:crypto");
      const uniqueId = crypto.randomUUID();
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const newFilename = `${uniqueId}-${safeName}`;

      return NextResponse.json({
        url: dataUrl,
        pathname: newFilename,
        contentType: mimeType,
        contentDisposition: `inline; filename="${safeName}"`,
      });
    } catch (error: any) {
      console.error("Upload error details:", error);
      return NextResponse.json(
        { error: error?.message || "Upload failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Outer upload error details:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
