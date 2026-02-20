import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
const IMAGE_MODEL = "maia/gemini-2.5-flash-image-preview";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PRO-only feature — check type (set in JWT callback) or role
    const userType = (session.user as any).type;
    const userRole = (session.user as any).role;
    const hasPro = userType === "pro" || userRole === "admin";

    if (!hasPro) {
      return NextResponse.json(
        { error: "Image generation is a PRO feature. Upgrade to access." },
        { status: 403 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!MAIA_API_KEY) {
      return NextResponse.json(
        { error: "Image generation not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.maiarouter.ai/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAIA_API_KEY}`,
          "HTTP-Referer": "https://ultramaxo.tech",
          "X-Title": "Ultramaxo AI",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: prompt.trim(),
          n: 1,
          response_format: "b64_json",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-image] MAIA error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate image. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      console.error("[generate-image] No image in response:", data);
      return NextResponse.json(
        { error: "No image returned from generator" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`,
    });
  } catch (error) {
    console.error("[generate-image] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
