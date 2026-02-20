import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const MAIA_API_KEY = (process.env.OPENROUTER_API_KEY_1 || "").trim();
// Use Vertex AI Gemini endpoint — gemini-2.5-flash can generate images
const MODEL_NAME = "gemini-2.5-flash-image-preview";
const VERTEX_URL = `https://api.maiarouter.ai/vertex_ai/publishers/google/models/${MODEL_NAME}:generateContent`;

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

    console.log("[generate-image] Calling Vertex AI Gemini:", VERTEX_URL);

    // Use Gemini generateContent format for Vertex AI image generation
    const response = await fetch(VERTEX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAIA_API_KEY}`,
        "HTTP-Referer": "https://ultramaxo.tech",
        "X-Title": "Ultramaxo AI",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt.trim() }],
          },
        ],
        generation_config: {
          response_modalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    const rawText = await response.text();
    console.log("[generate-image] status:", response.status);
    console.log("[generate-image] response:", rawText.slice(0, 800));

    if (!response.ok) {
      return NextResponse.json(
        { error: `Generator error (${response.status}). Please try again.` },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Invalid response from generator" },
        { status: 500 }
      );
    }

    // Extract image from Gemini response: candidates[0].content.parts[].inlineData
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part?.inlineData?.data) {
        const mimeType =
          part.inlineData.mime_type || part.inlineData.mimeType || "image/png";
        return NextResponse.json({
          imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
        });
      }
    }

    // Fallback: check standard OpenAI images format just in case
    const urlImg = data?.data?.[0]?.url;
    const b64Img = data?.data?.[0]?.b64_json;
    if (urlImg) return NextResponse.json({ imageUrl: urlImg });
    if (b64Img)
      return NextResponse.json({ imageUrl: `data:image/png;base64,${b64Img}` });

    console.error(
      "[generate-image] Unexpected response shape:",
      JSON.stringify(data).slice(0, 500)
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
