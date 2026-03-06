"use client";
import {
	CheckCircle2Icon,
	Clock3Icon,
	MonitorSmartphoneIcon,
	PackageIcon,
	PlayIcon,
	SmartphoneIcon,
	SparklesIcon as LucideSparklesIcon,
	WandSparklesIcon,
} from "lucide-react";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useState } from "react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { ResponseViewer } from "./response-viewer";
import { Weather, type WeatherAtLocation } from "./weather";

// ============================================================
// MessageTextPart — renders text with OOM-safe truncation
// ============================================================
function MessageTextPart({
	rawText,
	isHuge,
	maxChars,
	messageRole,
	isLoading,
	hasAnyArtifact,
}: {
	rawText: string;
	isHuge: boolean;
	maxChars: number;
	messageRole: string;
	isLoading: boolean;
	hasAnyArtifact: boolean;
}) {
	const [expanded, setExpanded] = useState(false);

	const displayText =
		isHuge && !expanded ? rawText.slice(0, maxChars) : rawText;

	return (
		<div>
			<MessageContent
				className={cn("w-full", {
					"bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 wrap-break-word w-fit text-left ml-auto px-5 py-3.5 rounded-3xl rounded-tr-sm":
						messageRole === "user",
					"bg-transparent px-0 py-0 text-left w-full prose-zinc dark:prose-invert prose-p:leading-relaxed":
						messageRole === "assistant",
				})}
				data-testid="message-content"
			>
				{messageRole === "assistant" ? (
					<ResponseViewer
						className={isLoading ? "streaming-cursor" : ""}
						hideCodeBlocks={hasAnyArtifact}
						text={displayText}
					/>
				) : (
					<Response className="text-[15px] leading-relaxed">
						{displayText}
					</Response>
				)}
			</MessageContent>
			{isHuge && !expanded && (
				<div className="mt-2 text-center">
					<button
						className="rounded-md bg-zinc-800 px-4 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
						onClick={() => setExpanded(true)}
						type="button"
					>
						⚠️ Pesan ini sangat panjang ({(rawText.length / 1000).toFixed(0)}KB).
						Klik untuk tampilkan semua
					</button>
				</div>
			)}
		</div>
	);
}

const PurePreviewMessage = ({
	addToolApprovalResponse,
	chatId,
	message,
	vote,
	isLoading,
	setMessages,
	regenerate,
	isReadonly,
	requiresScrollPadding: _requiresScrollPadding,
}: {
	addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
	chatId: string;
	message: ChatMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
	regenerate: UseChatHelpers<ChatMessage>["regenerate"];
	isReadonly: boolean;
	requiresScrollPadding: boolean;
}) => {
	const [mode, setMode] = useState<"view" | "edit">("view");

	const attachmentsFromMessage = message.parts.filter(
		(part) => part.type === "file",
	);

	const hasAnyArtifact =
		message.parts?.some(
			(part) =>
				part.type === "tool-createDocument" ||
				part.type === "tool-updateDocument",
		) ||
		message.annotations?.some((annotation) => {
			const parsed =
				typeof annotation === "object" && annotation !== null
					? (annotation as Record<string, unknown>)
					: null;

			return (
				parsed?.type === "create-document" ||
				parsed?.type === "update-document"
			);
		}) ||
		false;

	useDataStream();

	return (
		<div
			className="group/message fade-in w-full animate-in duration-200"
			data-role={message.role}
			data-testid={`message-${message.role}`}
		>
			<div
				className={cn("flex w-full items-start gap-2 md:gap-3", {
					"justify-end": message.role === "user" && mode !== "edit",
					"justify-start": message.role === "assistant",
				})}
			>
				{message.role === "assistant" && (
					<div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border text-zinc-900 dark:text-zinc-100">
						<SparklesIcon size={14} />
					</div>
				)}

				<div
					className={cn("flex flex-col min-w-0", {
						"gap-2 md:gap-4": message.parts?.some(
							(p) => p.type === "text" && p.text?.trim(),
						),
						"w-full":
							(message.role === "assistant" &&
								(message.parts?.some(
									(p) => p.type === "text" && p.text?.trim(),
								) ||
									message.parts?.some((p) => p.type.startsWith("tool-")))) ||
							mode === "edit",
						"max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,85%)]":
							message.role === "user" && mode !== "edit",
					})}
				>
					{attachmentsFromMessage.length > 0 && (
						<div
							className="flex flex-row justify-end gap-2"
							data-testid={"message-attachments"}
						>
							{attachmentsFromMessage.map((attachment) => (
								<PreviewAttachment
									attachment={{
										name: attachment.filename ?? "file",
										contentType: attachment.mediaType,
										url: attachment.url,
									}}
									key={attachment.url}
								/>
							))}
						</div>
					)}

					{/* Render message parts */}
					{message.parts?.map((part, index) => {
						const { type } = part;
						const key = `message-${message.id}-part-${index}`;

						if (type === "reasoning") {
							const hasContent = part.text?.trim().length > 0;
							const isStreaming = "state" in part && part.state === "streaming";
							if (hasContent || isStreaming) {
								return (
									<MessageReasoning
										isLoading={isLoading || isStreaming}
										key={key}
										reasoning={part.text || ""}
									/>
								);
							}
						}

						if (type === "text") {
							if (mode === "view") {
								const rawText = sanitizeText(part.text);
								const MAX_MSG_CHARS = 15_000;
								const isHuge = rawText.length > MAX_MSG_CHARS;

								return (
									<MessageTextPart
										key={key}
										rawText={rawText}
										isHuge={isHuge}
										maxChars={MAX_MSG_CHARS}
										messageRole={message.role}
										isLoading={isLoading}
										hasAnyArtifact={hasAnyArtifact}
									/>
								);
							}

							if (mode === "edit") {
								return (
									<div
										className="flex w-full flex-row items-start gap-3"
										key={key}
									>
										<div className="size-8" />
										<div className="min-w-0 flex-1">
											<MessageEditor
												key={message.id}
												message={message}
												regenerate={regenerate}
												setMessages={setMessages}
												setMode={setMode}
											/>
										</div>
									</div>
								);
							}
						}

						if (type === "tool-getWeather") {
							const { toolCallId, state } = part;
							const approvalId = (part as { approval?: { id: string } })
								.approval?.id;
							const isDenied =
								state === "output-denied" ||
								(state === "approval-responded" &&
									(part as { approval?: { approved?: boolean } }).approval
										?.approved === false);
							const widthClass = "w-[min(100%,450px)]";

							if (state === "output-available") {
								return (
									<div className={widthClass} key={toolCallId}>
										<Weather
											weatherAtLocation={part.output as WeatherAtLocation}
										/>
									</div>
								);
							}

							if (isDenied) {
								return (
									<div className={widthClass} key={toolCallId}>
										<Tool className="w-full" defaultOpen={true}>
											<ToolHeader
												state="output-denied"
												type="tool-getWeather"
											/>
											<ToolContent>
												<div className="px-4 py-3 text-muted-foreground text-sm">
													Weather lookup was denied.
												</div>
											</ToolContent>
										</Tool>
									</div>
								);
							}

							if (state === "approval-responded") {
								return (
									<div className={widthClass} key={toolCallId}>
										<Tool className="w-full" defaultOpen={true}>
											<ToolHeader state={state} type="tool-getWeather" />
											<ToolContent>
												<ToolInput input={part.input} />
											</ToolContent>
										</Tool>
									</div>
								);
							}

							return (
								<div className={widthClass} key={toolCallId}>
									<Tool className="w-full" defaultOpen={true}>
										<ToolHeader state={state} type="tool-getWeather" />
										<ToolContent>
											{(state === "input-available" ||
												state === "approval-requested") && (
												<ToolInput input={part.input} />
											)}
											{state === "approval-requested" && approvalId && (
												<div className="flex items-center justify-end gap-2 border-t px-4 py-3">
													<button
														className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
														onClick={() => {
															addToolApprovalResponse({
																id: approvalId,
																approved: false,
																reason: "User denied weather lookup",
															});
														}}
														type="button"
													>
														Deny
													</button>
													<button
														className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
														onClick={() => {
															addToolApprovalResponse({
																id: approvalId,
																approved: true,
															});
														}}
														type="button"
													>
														Allow
													</button>
												</div>
											)}
										</ToolContent>
									</Tool>
								</div>
							);
						}

						if (
							type === "tool-createDocument" ||
							type === "tool-updateDocument"
						) {
							const { toolCallId, state } = part;
							const toolType =
								type === "tool-createDocument" ? "create" : "update";

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type={type} />
									<ToolContent>
										{(state === "input-streaming" ||
											state === "input-available") && (
											<DocumentToolCall
												type={toolType}
												args={part.input as any}
												isReadonly={isReadonly}
											/>
										)}
										{state === "output-available" && (
											<DocumentToolResult
												type={toolType}
												result={
													part.output as {
														id: string;
														title: string;
														kind: "image" | "text" | "code" | "sheet";
														content?: string;
													}
												}
												isReadonly={isReadonly}
											/>
										)}
									</ToolContent>
								</Tool>
							);
						}

						if (type === "tool-startAgentTask") {
							const { toolCallId, state } = part;
							const payload =
								state === "output-available" ? part.output : part.input;
							const agentTask = payload as {
								mode: "fullstack" | "mobile";
								goal: string;
								plan: string[];
								deliverable: string;
							};

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type="tool-startAgentTask" />
									<ToolContent>
										<div className="space-y-4 px-4 py-4">
											<div className="flex items-center gap-2 text-sm font-medium text-foreground">
												{agentTask.mode === "mobile" ? (
													<SmartphoneIcon className="size-4 text-pink-500" />
												) : (
													<MonitorSmartphoneIcon className="size-4 text-orange-500" />
												)}
												<span>
													{agentTask.mode === "mobile"
														? "Mobile Dev Agent"
														: "Fullstack Agent"}
												</span>
											</div>

											<div className="rounded-xl border bg-muted/40 p-3">
												<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
													Goal
												</div>
												<p className="text-sm leading-relaxed text-foreground">
													{agentTask.goal}
												</p>
											</div>

											<div className="rounded-xl border bg-background p-3">
												<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
													Execution Plan
												</div>
												<ul className="space-y-2">
													{agentTask.plan.map((planItem, planIndex) => (
														<li
															className="flex items-start gap-2 text-sm text-foreground"
															key={`${toolCallId}-plan-${planIndex}`}
														>
															<WandSparklesIcon className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
															<span>{planItem}</span>
														</li>
													))}
												</ul>
											</div>

											<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
												<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
													Deliverable
												</div>
												{agentTask.deliverable}
											</div>
										</div>
									</ToolContent>
								</Tool>
							);
						}

						if (type === "tool-reportAgentStep") {
							const { toolCallId, state } = part;
							const payload =
								state === "output-available" ? part.output : part.input;
							const step = payload as {
								title: string;
								status: "in_progress" | "completed";
								detail: string;
								files?: string[];
								packages?: string[];
								command?: string | null;
							};

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type="tool-reportAgentStep" />
									<ToolContent>
										<div className="space-y-3 px-4 py-4">
											<div className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3">
												<div className="flex items-start gap-2">
													{step.status === "completed" ? (
														<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
													) : (
														<Clock3Icon className="mt-0.5 size-4 shrink-0 animate-pulse text-amber-500" />
													)}
													<div>
														<div className="text-sm font-medium text-foreground">
															{step.title}
														</div>
														<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
															{step.detail}
														</p>
													</div>
												</div>
												<div className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
													{step.status === "completed" ? "Done" : "Running"}
												</div>
											</div>

											{step.files && step.files.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														<LucideSparklesIcon className="size-3.5" />
														Files
													</div>
													<div className="flex flex-wrap gap-2">
														{step.files.map((file) => (
															<span
																className="rounded-full border bg-background px-2.5 py-1 font-mono text-xs text-foreground"
																key={`${toolCallId}-${file}`}
															>
																{file}
															</span>
														))}
													</div>
												</div>
											)}

											{step.packages && step.packages.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														<PackageIcon className="size-3.5" />
														Packages
													</div>
													<div className="flex flex-wrap gap-2">
														{step.packages.map((pkg) => (
															<span
																className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground"
																key={`${toolCallId}-${pkg}`}
															>
																{pkg}
															</span>
														))}
													</div>
												</div>
											)}

											{step.command && (
												<div className="rounded-xl border bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 dark:bg-zinc-900">
													<div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
														<PlayIcon className="size-3.5" />
														Action
													</div>
													{step.command}
												</div>
											)}
										</div>
									</ToolContent>
								</Tool>
							);
						}

						if (
							type === "tool-listCodeFiles" ||
							type === "tool-createCodeFile" ||
							type === "tool-updateCodeFile" ||
							type === "tool-deleteCodeFile" ||
							type === "tool-runWorkspaceCommand"
						) {
							const { toolCallId, state } = part;
							const payload =
								state === "output-available" ? part.output : part.input;

							if (type === "tool-runWorkspaceCommand") {
								const commandResult = payload as {
									command: string;
									purpose: string;
									result: string;
								};

								return (
									<Tool defaultOpen={true} key={toolCallId}>
										<ToolHeader state={state} type={type} />
										<ToolContent>
											<div className="space-y-3 px-4 py-4">
												<div className="rounded-xl border bg-zinc-950 px-3 py-3 font-mono text-xs text-zinc-100 dark:bg-zinc-900">
													<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
														<PlayIcon className="size-3.5" />
														Virtual Command
													</div>
													{commandResult.command}
												</div>
												<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Purpose
													</div>
													{commandResult.purpose}
												</div>
												<div className="rounded-xl border bg-background p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Result
													</div>
													{commandResult.result}
												</div>
											</div>
										</ToolContent>
									</Tool>
								);
							}

							const workspacePayload = payload as {
								documentId?: string;
								path?: string;
								action?: string;
								files?: string[];
								count?: number;
							};

							const titleMap: Record<string, string> = {
								"tool-listCodeFiles": "Workspace Files",
								"tool-createCodeFile": "Create File",
								"tool-updateCodeFile": "Update File",
								"tool-deleteCodeFile": "Delete File",
							};

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type={type} />
									<ToolContent>
										<div className="space-y-3 px-4 py-4">
											<div className="flex items-center gap-2 text-sm font-medium text-foreground">
												<LucideSparklesIcon className="size-4 text-cyan-500" />
												<span>{titleMap[type] ?? "Workspace Action"}</span>
											</div>

											{workspacePayload.path && (
												<div className="rounded-xl border bg-background p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Path
													</div>
													<div className="font-mono text-xs">{workspacePayload.path}</div>
												</div>
											)}

											{typeof workspacePayload.count === "number" && (
												<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
													{workspacePayload.count} files available in the virtual workspace.
												</div>
											)}

											{workspacePayload.files && workspacePayload.files.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Files
													</div>
													<div className="flex flex-wrap gap-2">
														{workspacePayload.files.map((file) => (
															<span
																className="rounded-full border bg-background px-2.5 py-1 font-mono text-xs text-foreground"
																key={`${toolCallId}-${file}`}
															>
																{file}
															</span>
														))}
													</div>
												</div>
											)}
										</div>
									</ToolContent>
								</Tool>
							);
						}

						if (type === "tool-requestSuggestions") {
							const { toolCallId, state } = part;

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type="tool-requestSuggestions" />
									<ToolContent>
										{state === "input-available" && (
											<ToolInput input={part.input} />
										)}
										{state === "output-available" && (
											<ToolOutput
												errorText={undefined}
												output={
													(part.output as any)?.error ? (
														<div className="rounded border p-2 text-red-500">
															Error: {String((part.output as any).error)}
														</div>
													) : (
														<DocumentToolResult
															isReadonly={isReadonly}
															result={
																part.output as {
																	id: string;
																	title: string;
																	kind: "image" | "text" | "code" | "sheet";
																}
															}
															type="request-suggestions"
														/>
													)
												}
											/>
										)}
									</ToolContent>
								</Tool>
							);
						}

						return null;
					})}

					{/* Render tool events injected via message annotations */}
					{message.annotations?.map((annotation, index) => {
						const key = `message-${message.id}-annotation-${index}`;
						const parsed =
							typeof annotation === "object" && annotation !== null
								? (annotation as Record<string, any>)
								: null;

						if (!parsed || !("type" in parsed)) return null;

						if (
							parsed.type === "create-document" ||
							parsed.type === "update-document"
						) {
							const toolType =
								parsed.type === "create-document" ? "create" : "update";

							// Since annotations are sent on execution block (call), we emulate tool properties
							return (
								<Tool defaultOpen={true} key={key}>
									<ToolHeader
										state="input-available"
										type={`tool-${parsed.type === "create-document" ? "createDocument" : "updateDocument"}`}
									/>
									<ToolContent>
										<DocumentToolCall
											type={toolType}
											args={{
												title: "title" in parsed ? parsed.title : "",
												kind:
													"kind" in parsed
														? (parsed.kind as
																| "code"
																| "text"
																| "sheet"
																| "image")
														: "text",
											}}
											isReadonly={isReadonly}
										/>
									</ToolContent>
								</Tool>
							);
						}

						return null;
					})}

					{!isReadonly && (
						<MessageActions
							chatId={chatId}
							isLoading={isLoading}
							key={`action-${message.id}`}
							message={message}
							setMode={setMode}
							vote={vote}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
	return (
		<div
			className="group/message fade-in w-full animate-in duration-300"
			data-role="assistant"
			data-testid="message-assistant-loading"
		>
			<div className="flex items-start justify-start gap-3">
				<div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
					<div className="animate-pulse">
						<SparklesIcon size={14} />
					</div>
				</div>

				<div className="flex w-full flex-col gap-2 md:gap-4">
					<div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
						<span className="animate-pulse">Thinking</span>
						<span className="inline-flex">
							<span className="animate-bounce [animation-delay:0ms]">.</span>
							<span className="animate-bounce [animation-delay:150ms]">.</span>
							<span className="animate-bounce [animation-delay:300ms]">.</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
