"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MailIcon, ReplyIcon, CheckCircle2Icon, ArchiveIcon, Loader2, RefreshCcw } from "lucide-react";

type InboxMessage = {
	id: string;
	messageId: string;
	fromEmail: string;
	fromName: string | null;
	toEmail: string;
	subject: string | null;
	textBody: string | null;
	htmlBody: string | null;
	status: "unread" | "read" | "replied" | "archived";
	receivedAt: string;
};

export default function AdminInboxPage() {
	const [messages, setMessages] = useState<InboxMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
	const [replyText, setReplyText] = useState("");
	const [sendingReply, setSendingReply] = useState(false);

	const fetchMessages = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/inbox");
			const data = await res.json();
			if (data.success) {
				setMessages(data.messages);
			}
		} catch (error) {
			toast.error("Failed to load inbox messages");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMessages();
	}, []);

	const updateStatus = async (id: string, status: string) => {
		try {
			await fetch("/api/admin/inbox", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status }),
			});
			setMessages(messages.map((m) => (m.id === id ? { ...m, status: status as any } : m)));
			if (selectedMessage?.id === id) {
				setSelectedMessage({ ...selectedMessage, status: status as any });
			}
		} catch (error) {
			toast.error("Failed to update message status");
		}
	};

	const handleSelectMessage = (msg: InboxMessage) => {
		setSelectedMessage(msg);
		if (msg.status === "unread") {
			updateStatus(msg.id, "read");
		}
		setReplyText(""); // Reset reply text
	};

	const handleSendReply = async () => {
		if (!selectedMessage || !replyText.trim()) return;

		setSendingReply(true);
		try {
			const res = await fetch("/api/admin/inbox/reply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: selectedMessage.id,
					toEmail: selectedMessage.fromEmail,
					subject: `Re: ${selectedMessage.subject || "Your Message"}`,
					textBody: replyText,
				}),
			});
			const data = await res.json();
			
			if (data.success) {
				toast.success("Reply sent successfully via Resend!");
				setMessages(messages.map((m) => (m.id === selectedMessage.id ? { ...m, status: "replied" } : m)));
				setSelectedMessage({ ...selectedMessage, status: "replied" });
				setReplyText("");
			} else {
				toast.error(data.error || "Failed to send reply");
			}
		} catch (error) {
			toast.error("Network error. Could not send reply.");
		} finally {
			setSendingReply(false);
		}
	};

	return (
		<div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
			{/* Header */}
			<div className="mb-8 pl-1 flex justify-between items-end">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
						<MailIcon className="text-zinc-900 dark:text-white" size={24} />
						Customer Support Inbox
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
						Manage incoming emails and reply directly using Resend.
					</p>
				</div>
				<button 
					onClick={fetchMessages}
					className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm transition-colors"
				>
					<RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
					Refresh
				</button>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[70vh]">
				{/* Inbox List */}
				<div className="lg:col-span-5 flex flex-col h-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
					<div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
						<h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recent Messages</h3>
					</div>
					
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{loading && messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-40 text-zinc-400">
								<Loader2 size={24} className="animate-spin mb-2" />
								<p className="text-sm">Loading inbox...</p>
							</div>
						) : messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-40 text-zinc-400">
								<MailIcon size={32} className="mb-2 opacity-20" />
								<p className="text-sm">Inbox is empty</p>
							</div>
						) : (
							messages.map((msg) => (
								<button
									key={msg.id}
									onClick={() => handleSelectMessage(msg)}
									className={`w-full text-left p-4 rounded-xl transition-all ${
										selectedMessage?.id === msg.id 
											? "bg-zinc-100 dark:bg-zinc-800/80 border-transparent" 
											: "hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border-transparent hover:border-zinc-200 dark:hover:border-white/5"
									} border border-transparent`}
								>
									<div className="flex justify-between items-start mb-1">
										<div className="flex items-center gap-2 overflow-hidden">
											<span className={`w-2 h-2 rounded-full shrink-0 ${msg.status === 'unread' ? 'bg-blue-500' : msg.status === 'replied' ? 'bg-green-500' : 'bg-transparent'}`} />
											<span className={`text-sm truncate ${msg.status === 'unread' ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
												{msg.fromName || msg.fromEmail}
											</span>
										</div>
										<span className="text-[10px] text-zinc-400 shrink-0 mt-0.5">
											{format(new Date(msg.receivedAt), "MMM d, HH:mm")}
										</span>
									</div>
									<div className={`text-xs truncate mb-1.5 ${msg.status === 'unread' ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
										{msg.subject || "No Subject"}
									</div>
									<div className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
										{msg.textBody || "No content"}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Message Details & Reply */}
				<div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
					{selectedMessage ? (
						<>
							{/* Message Header */}
							<div className="p-5 border-b border-zinc-200 dark:border-white/10">
								<div className="flex justify-between items-start mb-4">
									<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
										{selectedMessage.subject || "No Subject"}
									</h2>
									<div className="flex items-center gap-2">
										<button 
											onClick={() => updateStatus(selectedMessage.id, selectedMessage.status === "archived" ? "read" : "archived")}
											className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
											title="Archive"
										>
											<ArchiveIcon size={16} />
										</button>
									</div>
								</div>
								
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-medium">
										{selectedMessage.fromName ? selectedMessage.fromName.charAt(0).toUpperCase() : selectedMessage.fromEmail.charAt(0).toUpperCase()}
									</div>
									<div>
										<div className="text-sm font-medium text-zinc-900 dark:text-white">
											{selectedMessage.fromName} <span className="text-zinc-500 font-normal">&lt;{selectedMessage.fromEmail}&gt;</span>
										</div>
										<div className="text-xs text-zinc-500">
											{format(new Date(selectedMessage.receivedAt), "MMMM d, yyyy 'at' h:mm a")}
										</div>
									</div>
								</div>
							</div>

							{/* Message Content */}
							<div className="flex-1 p-6 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/20">
								<div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
									{selectedMessage.textBody || selectedMessage.htmlBody || "No content"}
								</div>
							</div>

							{/* Reply Box */}
							<div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
								<div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
									<ReplyIcon size={14} />
									Replying to {selectedMessage.fromEmail} via Resend
								</div>
								<textarea
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									placeholder="Write your reply here..."
									rows={4}
									className="w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-y dark:text-white mb-3"
								/>
								<div className="flex justify-between items-center">
									<span className="text-xs text-zinc-500 flex items-center gap-1">
										{selectedMessage.status === "replied" && (
											<><CheckCircle2Icon size={12} className="text-green-500" /> Already replied</>
										)}
									</span>
									<button
										onClick={handleSendReply}
										disabled={sendingReply || !replyText.trim()}
										className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-all"
									>
										{sendingReply ? <Loader2 size={16} className="animate-spin" /> : <SendIcon size={16} />}
										Send Reply
									</button>
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
							<div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
								<MailIcon size={24} />
							</div>
							<p className="text-sm font-medium">Select a message to read</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
