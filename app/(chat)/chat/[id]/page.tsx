import { DEFAULT_CHAT_MODEL } from "@backend/ai/models";
import {
	getChatById,
	getMessagesByChatId,
	getUserApiKeys,
} from "@backend/db/queries";
import { getChatAnnouncementSettings } from "@backend/db/queries-settings";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { ChatErrorBoundary } from "@/components/chat-error-boundary";
import { ChatRouteLoading } from "@/components/chat-route-loading";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { convertToUIMessages } from "@/lib/utils";

export default function Page(props: { params: Promise<{ id: string }> }) {
	return (
		<Suspense fallback={<ChatRouteLoading label="Opening chat..." />}>
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
	const announcement = await getChatAnnouncementSettings();

	const customModels: Array<{ id: string; name: string; provider: string }> =
		[];

	if (session?.user?.id) {
		const apiKeys = await getUserApiKeys(session.user.id);

		for (const key of apiKeys) {
			if (key.isEnabled && key.customModels) {
				for (const modelId of key.customModels) {
					customModels.push({
						id: `${key.provider}/${modelId}`,
						name: modelId,
						provider: key.provider,
					});
				}
			}
		}
	}

	const messagesFromDb = await getMessagesByChatId({ id });

	const uiMessages = convertToUIMessages(messagesFromDb);

	const cookieStore = await cookies();
	const chatModelFromCookie = cookieStore.get("chat-model");

	if (!chatModelFromCookie) {
		return (
			<ChatErrorBoundary>
				<Chat
					key={chat.id}
					autoResume={true}
					chatAnnouncement={announcement}
					id={chat.id}
					initialChatModel={DEFAULT_CHAT_MODEL}
					initialMessages={uiMessages}
					initialVisibilityType={chat.visibility}
					isAtLimit={false}
					isReadonly={isReadonly}
					user={session?.user}
					customModels={customModels}
				/>
				<DataStreamHandler key={`stream-${chat.id}`} />
			</ChatErrorBoundary>
		);
	}

	return (
		<ChatErrorBoundary>
			<Chat
				key={chat.id}
				autoResume={true}
				chatAnnouncement={announcement}
				id={chat.id}
				initialChatModel={chatModelFromCookie.value}
				initialMessages={uiMessages}
				initialVisibilityType={chat.visibility}
				isAtLimit={false}
				isReadonly={session?.user?.id !== chat.userId}
				user={session?.user}
				customModels={customModels}
			/>
			<DataStreamHandler key={`stream-${chat.id}`} />
		</ChatErrorBoundary>
	);
}
