import { auth } from "@/app/(auth)/auth";
import { createPurchaseRequest } from "@/lib/db/queries";

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

    const requestData = {
      userId: session.user.id,
      username: session.user.name || undefined,
      email: session.user.email || undefined,
      planId,
      months: months || 1,
      price,
    };

    const newRequest = await createPurchaseRequest(requestData);

    return Response.json({ success: true, request: newRequest });
  } catch (error) {
    console.error("Upgrade API Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
