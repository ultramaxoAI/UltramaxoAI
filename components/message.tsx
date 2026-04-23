"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
	CheckCircle2Icon,
	Clock3Icon,
	SparklesIcon as LucideSparklesIcon,
	MonitorSmartphoneIcon,
	PackageIcon,
	PlayIcon,
	SmartphoneIcon,
	WandSparklesIcon,
} from "lucide-react";
import { useState } from "react";
import type { Vote } from "@backend/db/schema";
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

type DocumentToolCallArgs =
	| { title: string; kind: "image" | "text" | "code" | "sheet" }
	| { id: string; description: string }
	| { documentId: string };

type DocumentToolResultData = {
	id: string;
	title: string;
	kind: "image" | "text" | "code" | "sheet";
	content?: string;
	error?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getStringValue(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function getStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
}

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
					"wrap-break-word ml-auto w-fit max-w-[85%] sm:max-w-[70%] rounded-3xl rounded-br-lg md:rounded-br-xl bg-[#f4f4f4] px-4 py-2.5 text-left text-[#171717] shadow-none dark:bg-[#2f2f2f] dark:text-white":
						messageRole === "user",
					"w-full bg-transparent px-0 py-1 text-left prose-zinc dark:prose-invert prose-p:leading-7":
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
					<Response className="text-[14px] leading-relaxed">
						{displayText}
					</Response>
				)}
			</MessageContent>
			{isHuge && !expanded && (
				<div className="mt-2 text-center">
					<button
						className="rounded-full border border-white/8 bg-[#1a1d20] px-4 py-2 text-xs text-[#f3f4f1] transition-colors hover:bg-[#22262a] dark:border-black/8 dark:bg-[#eceee9] dark:text-[#111315] dark:hover:bg-[#e1e4de]"
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
				parsed?.type === "create-document" || parsed?.type === "update-document"
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
				className={cn(
					"mx-auto flex w-full max-w-3xl flex-col gap-4",
					message.role === "user" ? "" : "group-data-[top=true]:mt-[6vh]",
				)}
			>
				{message.role === "assistant" && (
					<div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[#6f746f] dark:text-[#8f9790]">
						<SparklesIcon size={14} />
					</div>
				)}

				<div
					className={cn("flex flex-col min-w-0", {
						"gap-1 md:gap-2": message.parts?.some(
							(p) => p.type === "text" && p.text?.trim(),
						),
						"w-full":
							(message.role === "assistant" &&
								(message.parts?.some(
									(p) => p.type === "text" && p.text?.trim(),
								) ||
									message.parts?.some((p) => p.type.startsWith("tool-")))) ||
							mode === "edit",
						"max-w-[calc(100%-1.75rem)] sm:max-w-[min(fit-content,68%)]":
							message.role === "user" && mode !== "edit",
					})}
				>
					{attachmentsFromMessage.length > 0 && (
						<div
							className="flex flex-row justify-end gap-2 pr-0.5"
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
												args={part.input as DocumentToolCallArgs}
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
							const agentTask = isRecord(payload) ? payload : {};
							const agentMode =
								agentTask.mode === "mobile" ? "mobile" : "fullstack";
							const agentPlan = getStringArray(agentTask.plan);

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type="tool-startAgentTask" />
									<ToolContent>
										<div className="space-y-4 px-4 py-4">
											<div className="flex items-center gap-2 text-sm font-medium text-foreground">
												{agentMode === "mobile" ? (
													<SmartphoneIcon className="size-4 text-pink-500" />
												) : (
													<MonitorSmartphoneIcon className="size-4 text-orange-500" />
												)}
												<span>
													{agentMode === "mobile"
														? "Mobile Dev Agent"
														: "Fullstack Agent"}
												</span>
											</div>

											<div className="rounded-xl border bg-muted/40 p-3">
												<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
													Goal
												</div>
												<p className="text-sm leading-relaxed text-foreground">
													{getStringValue(
														agentTask.goal,
														"Agent task started.",
													)}
												</p>
											</div>

											<div className="rounded-xl border bg-background p-3">
												<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
													Execution Plan
												</div>
												<ul className="space-y-2">
													{agentPlan.map((planItem) => (
														<li
															className="flex items-start gap-2 text-sm text-foreground"
															key={`${toolCallId}-plan-${planItem}`}
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
												{getStringValue(
													agentTask.deliverable,
													"Preparing workspace changes.",
												)}
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
							const step = isRecord(payload) ? payload : {};
							const stepStatus =
								step.status === "completed" ? "completed" : "in_progress";
							const stepFiles = getStringArray(step.files);
							const stepPackages = getStringArray(step.packages);
							const stepCommand =
								typeof step.command === "string" ? step.command : "";

							return (
								<Tool defaultOpen={true} key={toolCallId}>
									<ToolHeader state={state} type="tool-reportAgentStep" />
									<ToolContent>
										<div className="space-y-3 px-4 py-4">
											<div className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3">
												<div className="flex items-start gap-2">
													{stepStatus === "completed" ? (
														<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
													) : (
														<Clock3Icon className="mt-0.5 size-4 shrink-0 animate-pulse text-amber-500" />
													)}
													<div>
														<div className="text-sm font-medium text-foreground">
															{getStringValue(step.title, "Agent step")}
														</div>
														<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
															{getStringValue(
																step.detail,
																"Processing workspace changes.",
															)}
														</p>
													</div>
												</div>
												<div className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
													{stepStatus === "completed" ? "Done" : "Running"}
												</div>
											</div>

											{stepFiles.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														<LucideSparklesIcon className="size-3.5" />
														Files
													</div>
													<div className="flex flex-wrap gap-2">
														{stepFiles.map((file) => (
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

											{stepPackages.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														<PackageIcon className="size-3.5" />
														Packages
													</div>
													<div className="flex flex-wrap gap-2">
														{stepPackages.map((pkg) => (
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

											{stepCommand && (
												<div className="rounded-xl border bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 dark:bg-zinc-900">
													<div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
														<PlayIcon className="size-3.5" />
														Action
													</div>
													{stepCommand}
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
								const commandResult: Record<string, unknown> = isRecord(payload)
									? payload
									: {};

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
													{getStringValue(
														commandResult.command,
														"Unavailable command",
													)}
												</div>
												<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Purpose
													</div>
													{getStringValue(
														commandResult.purpose,
														"Virtual workspace command",
													)}
												</div>
												<div className="rounded-xl border bg-background p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Result
													</div>
													{getStringValue(
														commandResult.result,
														"No result available",
													)}
												</div>
											</div>
										</ToolContent>
									</Tool>
								);
							}

							const workspacePayload: Record<string, unknown> = isRecord(
								payload,
							)
								? payload
								: {};
							const workspaceFiles = getStringArray(workspacePayload.files);

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

											{typeof workspacePayload.path === "string" && (
												<div className="rounded-xl border bg-background p-3 text-sm text-foreground">
													<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Path
													</div>
													<div className="font-mono text-xs">
														{workspacePayload.path}
													</div>
												</div>
											)}

											{typeof workspacePayload.count === "number" && (
												<div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
													{workspacePayload.count} files available in the
													virtual workspace.
												</div>
											)}

											{workspaceFiles.length > 0 && (
												<div className="rounded-xl border bg-muted/40 p-3">
													<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
														Files
													</div>
													<div className="flex flex-wrap gap-2">
														{workspaceFiles.map((file) => (
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
										{state === "output-available" &&
											(() => {
												const suggestionOutput =
													part.output as DocumentToolResultData;

												return (
													<ToolOutput
														errorText={undefined}
														output={
															suggestionOutput.error ? (
																<div className="rounded border p-2 text-red-500">
																	Error: {String(suggestionOutput.error)}
																</div>
															) : (
																<DocumentToolResult
																	isReadonly={isReadonly}
																	result={suggestionOutput}
																	type="request-suggestions"
																/>
															)
														}
													/>
												);
											})()}
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
								? (annotation as Record<string, unknown>)
								: null;

						if (!parsed || !("type" in parsed)) return null;

						if (
							parsed.type === "create-document" ||
							parsed.type === "update-document"
						) {
							const toolType =
								parsed.type === "create-document" ? "create" : "update";
							const parsedTitle =
								typeof parsed.title === "string" ? parsed.title : "";
							const parsedKind =
								parsed.kind === "code" ||
								parsed.kind === "text" ||
								parsed.kind === "sheet" ||
								parsed.kind === "image"
									? parsed.kind
									: "text";

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
												title: parsedTitle,
												kind: parsedKind,
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
				<div className="-mt-0.5 flex size-7 shrink-0 items-center justify-center text-[#6f746f] dark:text-[#8f9790]">
					<div className="animate-pulse">
						<SparklesIcon size={14} />
					</div>
				</div>

				<div className="flex w-full flex-col gap-2 md:gap-4">
					<div className="flex items-center gap-1 p-0 text-[#6f746f] text-sm dark:text-[#8f9790]">
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
