import { notFound } from "next/navigation";
import { getChatById, getMessagesByChatId } from "@backend/db/queries";

function getPlainText(parts: unknown) {
	if (!Array.isArray(parts)) {
		return "";
	}

	return parts
		.map((part) => {
			if (!part || typeof part !== "object") {
				return "";
			}

			const candidate = part as { type?: string; text?: string };
			return candidate.type === "text" ? candidate.text ?? "" : "";
		})
		.filter(Boolean)
		.join("\n\n");
}

export default async function SharedChatPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const chat = await getChatById({ id });

	if (!chat || chat.visibility !== "public") {
		notFound();
	}

	const messages = await getMessagesByChatId({ id });

	return (
		<div className="min-h-screen bg-[#f6f4ee] px-4 py-10 text-[#171717] dark:bg-[#0c0f11] dark:text-[#f4f4f1] sm:px-6 lg:px-8">
			<div className="mx-auto max-w-4xl">
				<div className="rounded-[28px] border border-black/8 bg-white/85 p-6 shadow-[0_24px_80px_rgba(17,19,21,0.08)] backdrop-blur dark:border-white/8 dark:bg-white/5 dark:shadow-none sm:p-8">
					<div className="mb-8 border-b border-black/6 pb-6 dark:border-white/8">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
							Shared chat
						</p>
						<h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
							{chat.title}
						</h1>
						<p className="mt-2 text-sm text-[#5f6258] dark:text-[#a6aca6]">
							Read-only public transcript from Ultramaxo.
						</p>
					</div>

					<div className="space-y-4">
						{messages.map((message) => (
							<div
								className={`rounded-3xl px-5 py-4 ${
									message.role === "user"
										? "ml-auto max-w-[85%] bg-[#111315] text-[#f4f4f1]"
										: "mr-auto max-w-[90%] border border-black/6 bg-[#f7f3ea] text-[#171717] dark:border-white/8 dark:bg-[#14181c] dark:text-[#f4f4f1]"
								}`}
								key={message.id}
							>
								<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
									{message.role}
								</p>
								<div className="whitespace-pre-wrap text-sm leading-7">
									{getPlainText(message.parts) || "Unsupported rich content"}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
