import { auth } from "@/app/(auth)/auth";
import { getDocumentById, setDocumentSharingById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function POST(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return new ChatSDKError("unauthorized:document").toResponse();
	}

	const body = await request.json();
	const id = body.id as string | undefined;
	const isShared = Boolean(body.isShared);

	if (!id) {
		return new ChatSDKError("bad_request:api", "Document id is required").toResponse();
	}

	const existingDocument = await getDocumentById({ id });

	if (!existingDocument || existingDocument.userId !== session.user.id) {
		return new ChatSDKError("forbidden:document").toResponse();
	}

	const document = await setDocumentSharingById({
		id,
		userId: session.user.id,
		isShared,
	});

	return Response.json({ document }, { status: 200 });
}
