import { cookies } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getTodayMessageCount, getUserById } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export default function Page() {
	return (
		<Suspense fallback={<div className="flex h-dvh" />}>
			<NewChatPage />
		</Suspense>
	);
}

async function NewChatPage() {
	const [session, cookieStore] = await Promise.all([auth(), cookies()]);
	const modelIdFromCookie = cookieStore.get("chat-model");
	const id = generateUUID();

	let isAtLimit = false;
	if (session?.user?.id) {
		const todayCount = await getTodayMessageCount(session.user.id);
		const [currentUser] = await getUserById(session.user.id);
		if (
			!currentUser?.isPro &&
			currentUser?.role !== "admin" &&
			todayCount >= 10 &&
			(currentUser?.limitCount || 0) <= 0
		) {
			isAtLimit = true;
		}
	}

	return (
		<>
			<Chat
				autoResume={false}
				id={id}
				initialChatModel={modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL}
				initialMessages={[]}
				initialVisibilityType="private"
				isAtLimit={isAtLimit}
				isReadonly={!session}
				key={id}
				user={session?.user}
			/>
			<DataStreamHandler />
		</>
	);
}
