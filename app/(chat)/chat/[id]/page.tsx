import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import {
	getChatById,
	getMessagesByChatId,
	getTodayMessageCount,
	getUserById,
} from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default function Page(props: { params: Promise<{ id: string }> }) {
	return (
		<Suspense fallback={<div className="flex h-dvh" />}>
			<ChatPage params={props.params} />
		</Suspense>
	);
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const chat = await getChatById({ id });

	if (!chat) {
		redirect("/");
	}

	const session = await auth();

	if (!session && chat.visibility === "private") {
		return notFound();
	}

	if (chat.visibility === "private") {
		if (!session?.user) {
			return notFound();
		}

		if (session.user.id !== chat.userId) {
			return notFound();
		}
	}

	const isReadonly = !session || session.user?.id !== chat.userId;

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

	const messagesFromDb = await getMessagesByChatId({
		id,
	});

	const uiMessages = convertToUIMessages(messagesFromDb);

	const cookieStore = await cookies();
	const chatModelFromCookie = cookieStore.get("chat-model");

	if (!chatModelFromCookie) {
		return (
			<>
				<Chat
					autoResume={true}
					id={chat.id}
					initialChatModel={DEFAULT_CHAT_MODEL}
					initialMessages={uiMessages}
					initialVisibilityType={chat.visibility}
					isAtLimit={isAtLimit}
					isReadonly={isReadonly}
					user={session?.user}
				/>
				<DataStreamHandler />
			</>
		);
	}

	return (
		<>
			<Chat
				autoResume={true}
				id={chat.id}
				initialChatModel={chatModelFromCookie.value}
				initialMessages={uiMessages}
				initialVisibilityType={chat.visibility}
				isAtLimit={isAtLimit}
				isReadonly={session?.user?.id !== chat.userId}
				user={session?.user}
			/>
			<DataStreamHandler />
		</>
	);
}
