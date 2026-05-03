import { DEFAULT_CHAT_MODEL } from "@backend/ai/models";
import { getUserApiKeys } from "@backend/db/queries";
import { getChatAnnouncementSettings } from "@backend/db/queries-settings";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
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

	const customModels: Array<{ id: string; name: string; provider: string }> =
		[];
	const announcement = await getChatAnnouncementSettings();

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

	return (
		<>
			<Chat
				autoResume={false}
				chatAnnouncement={announcement}
				id={id}
				initialChatModel={modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL}
				initialMessages={[]}
				initialVisibilityType="private"
				isAtLimit={false}
				isReadonly={!session}
				key={id}
				user={session?.user}
				customModels={customModels}
			/>
			<DataStreamHandler />
		</>
	);
}
