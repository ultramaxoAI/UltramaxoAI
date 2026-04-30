import { getModelCatalogById } from "@backend/models/model-catalog";
import { NextResponse } from "next/server";

const MODEL_ID_ALIASES: Record<string, string> = {
	"gpt-5.3": "gpt-5.3-codex",
};

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const resolvedId = MODEL_ID_ALIASES[id] ?? id;
		const model = await getModelCatalogById(resolvedId);

		if (!model) {
			return NextResponse.json(
				{ error: { message: "Model not found", code: "model_not_found" } },
				{ status: 404, headers: CORS_HEADERS },
			);
		}

		return NextResponse.json(model, { headers: CORS_HEADERS });
	} catch (error) {
		console.error("Model Fetch Error:", error);
		return NextResponse.json(
			{ error: { message: "Failed to fetch model" } },
			{ status: 500, headers: CORS_HEADERS },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
