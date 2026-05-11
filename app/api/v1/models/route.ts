import { listPublicModels } from "@backend/models/public-models";
import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const models = listPublicModels({
		capability: searchParams.get("capability") ?? undefined,
		provider: searchParams.get("provider") ?? undefined,
		free: searchParams.has("free")
			? searchParams.get("free") === "true"
			: undefined,
		limit: searchParams.has("limit")
			? Number(searchParams.get("limit"))
			: undefined,
		offset: searchParams.has("offset")
			? Number(searchParams.get("offset"))
			: undefined,
	});

	return NextResponse.json({ data: models }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
