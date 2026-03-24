import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest } from "@/lib/db/queries";

// FIX #6: Tabel harga resmi server-side (harus cocok dengan frontend planId)
const PRICING_TABLE: Record<string, Record<number, number>> = {
	"Early Adopter (Pro)": { 1: 15000 },
	"1 Tahun": { 12: 150000 },
};

function getValidPrice(planId: string, months: number): number | null {
	const plan = PRICING_TABLE[planId];
	if (!plan) return null;
	return plan[months] ?? null;
}

export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		const { planId, price, months } = await request.json();

		if (!planId || !price) {
			return new Response("Missing required fields", { status: 400 });
		}

		// FIX #6: Validasi harga server-side
		const effectiveMonths = months || 1;
		const validPrice = getValidPrice(planId, effectiveMonths);
		if (validPrice === null) {
			return Response.json({ error: "Plan tidak valid" }, { status: 400 });
		}
		if (Number(price) !== validPrice) {
			console.warn(`[Upgrade] Price mismatch! Client: ${price}, Server: ${validPrice}`);
			return Response.json({ error: "Harga tidak sesuai" }, { status: 400 });
		}

		const requestData = {
			userId: session.user.id,
			username: session.user.name || undefined,
			email: session.user.email || undefined,
			planId,
			months: effectiveMonths,
			price: validPrice,
		};

		const newRequest = await createPurchaseRequest(requestData);

		return Response.json({ success: true, request: newRequest });
	} catch (error) {
		console.error("Upgrade API Error:", error);
		return Response.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
