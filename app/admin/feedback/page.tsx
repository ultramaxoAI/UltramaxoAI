"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCheck, Loader2, MessageSquareQuote, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type FeedbackEntry = {
	id: string;
	userId: string;
	message: string;
	source: "timed_prompt";
	status: "new" | "reviewed";
	createdAt: string;
	updatedAt: string;
	userName: string | null;
	userEmail: string;
};

export default function AdminFeedbackPage() {
	const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const fetchFeedback = useCallback(async () => {
		setLoading(true);

		try {
			const response = await fetch("/api/admin/feedback");
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || "Failed to load feedback");
			}

			setFeedback(data.feedback || []);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to load feedback",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFeedback();
	}, [fetchFeedback]);

	const handleStatusUpdate = async (
		id: string,
		nextStatus: FeedbackEntry["status"],
	) => {
		setUpdatingId(id);

		try {
			const response = await fetch("/api/admin/feedback", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id,
					status: nextStatus,
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || "Failed to update feedback");
			}

			setFeedback((current) =>
				current.map((entry) =>
					entry.id === id ? { ...entry, status: nextStatus } : entry,
				),
			);
			toast.success(
				nextStatus === "reviewed"
					? "Feedback marked as reviewed"
					: "Feedback moved back to new",
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update feedback",
			);
		} finally {
			setUpdatingId(null);
		}
	};

	const newCount = feedback.filter((entry) => entry.status === "new").length;
	const reviewedCount = feedback.filter(
		(entry) => entry.status === "reviewed",
	).length;

	return (
		<div className="mx-auto max-w-6xl space-y-8 p-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					Feedback
				</h1>
				<p className="mt-1 text-sm text-gray-500">
					Pesan singkat dari user yang muncul lewat prompt feedback di web.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-xs font-medium text-gray-500">Total Feedback</p>
					<p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
						{feedback.length}
					</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-xs font-medium text-gray-500">New</p>
					<p className="mt-1 text-xl font-semibold text-indigo-600 dark:text-indigo-400">
						{newCount}
					</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-xs font-medium text-gray-500">Reviewed</p>
					<p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
						{reviewedCount}
					</p>
				</div>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
				<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
					<div>
						<h2 className="text-sm font-medium text-gray-900 dark:text-white">
							Latest submissions
						</h2>
						<p className="mt-0.5 text-xs text-gray-500">
							Tinjau feedback terbaru dan tandai yang sudah dibaca.
						</p>
					</div>
					<button
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
						onClick={fetchFeedback}
						type="button"
					>
						<RefreshCcw size={14} />
						Refresh
					</button>
				</div>

				<div className="divide-y divide-gray-200 dark:divide-white/10">
					{loading ? (
						<div className="px-6 py-10 text-sm text-gray-500">Loading feedback...</div>
					) : feedback.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-6 py-14 text-center">
							<div className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
								<MessageSquareQuote size={18} />
							</div>
							<p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
								Belum ada feedback masuk
							</p>
							<p className="mt-1 max-w-md text-sm text-gray-500">
								Nanti feedback dari prompt 2 menit akan muncul di sini.
							</p>
						</div>
					) : (
						feedback.map((entry) => (
							<div
								className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
								key={entry.id}
							>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-sm font-medium text-gray-900 dark:text-white">
											{entry.userName || "Unnamed user"}
										</span>
										<span className="text-xs text-gray-400">{entry.userEmail}</span>
										<span
											className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
												entry.status === "new"
													? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
													: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
											}`}
										>
											{entry.status}
										</span>
										<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
											{entry.source}
										</span>
									</div>

									<p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-200">
										{entry.message}
									</p>

									<p className="mt-3 text-xs text-gray-500">
										{formatDistanceToNow(new Date(entry.createdAt), {
											addSuffix: true,
										})}
									</p>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									<button
										className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
										disabled={updatingId === entry.id}
										onClick={() =>
											handleStatusUpdate(
												entry.id,
												entry.status === "new" ? "reviewed" : "new",
											)
										}
										type="button"
									>
										{updatingId === entry.id ? (
											<Loader2 className="animate-spin" size={14} />
										) : (
											<CheckCheck size={14} />
										)}
										{entry.status === "new" ? "Mark reviewed" : "Mark as new"}
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
