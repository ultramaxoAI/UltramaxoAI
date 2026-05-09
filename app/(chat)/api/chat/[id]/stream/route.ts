import { getChatById, getStreamIdsByChatId } from "@backend/db/queries";
import { auth } from "@/app/(auth)/auth";
import { createResumableStreamContext } from "resumable-stream";
import { after } from "next/server";

function getStreamContext() {
	try {
		return createResumableStreamContext({ waitUntil: after });
	} catch {
		return null;
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!process.env.REDIS_URL) {
		return new Response(null, { status: 204 });
	}

	const { id } = await params;
	const chat = await getChatById({ id });

	if (!chat) {
		return new Response(null, { status: 404 });
	}

	const session = await auth();
	if (chat.visibility === "private") {
		if (!session?.user || session.user.id !== chat.userId) {
			return new Response(null, { status: 404 });
		}
	}

	const streamContext = getStreamContext();
	if (!streamContext) {
		return new Response(null, { status: 204 });
	}

	const streamIds = await getStreamIdsByChatId({ chatId: id });
	if (streamIds.length === 0) {
		return new Response(null, { status: 204 });
	}

	for (const streamId of [...streamIds].reverse()) {
		try {
			const resumedStream = await streamContext.resumeExistingStream(streamId);
			if (!resumedStream) {
				continue;
			}

			return new Response(resumedStream.pipeThrough(new TextEncoderStream()), {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					"X-Accel-Buffering": "no",
					Connection: "keep-alive",
				},
			});
		} catch {
			continue;
		}
	}

	return new Response(null, { status: 204 });
}
