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

    console.log(
      "[generate-image] user type:",
      userType,
      "role:",
      userRole,
      "hasPro:",
      hasPro
    );

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

    console.log("[generate-image] Calling MAIA with model:", IMAGE_MODEL);

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
          // Gemini models typically return URL format
          response_format: "url",
        }),
      }
    );

    const rawText = await response.text();
    console.log("[generate-image] MAIA status:", response.status);
    console.log("[generate-image] MAIA response:", rawText.slice(0, 800));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to generate image (${response.status}). Please try again.`,
        },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[generate-image] Failed to parse JSON:", rawText);
      return NextResponse.json(
        { error: "Invalid response from generator" },
        { status: 500 }
      );
    }

    // Handle URL response (Gemini default) or b64_json fallback
    const imageUrl = data?.data?.[0]?.url;
    const b64 = data?.data?.[0]?.b64_json;

    if (imageUrl) {
      return NextResponse.json({ imageUrl });
    }

    if (b64) {
      return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
    }

    console.error(
      "[generate-image] Unexpected response shape:",
      JSON.stringify(data)
    );
    return NextResponse.json(
      { error: "No image returned from generator" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[generate-image] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
