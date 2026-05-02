"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type MaintenanceScopeSettings = {
	key: "chat" | "api";
	maintenanceEnabled: boolean;
	maintenanceTemplate: string;
	maintenanceTitle: string;
	maintenanceMessage: string;
};

type SiteSettingsData = Record<"chat" | "api", MaintenanceScopeSettings>;

type ChatAnnouncementSettings = {
	enabled: boolean;
	title: string;
	message: string;
};

const DEFAULT_SCOPES: SiteSettingsData = {
	chat: {
		key: "chat",
		maintenanceEnabled: false,
		maintenanceTemplate: "minimal",
		maintenanceTitle: "We will be right back.",
		maintenanceMessage: "Lagi ada update kecil. Sebentar lagi balik.",
	},
	api: {
		key: "api",
		maintenanceEnabled: false,
		maintenanceTemplate: "minimal",
		maintenanceTitle: "API temporarily unavailable.",
		maintenanceMessage: "API sedang maintenance sementara. Coba lagi sebentar.",
	},
};

const DEFAULT_ANNOUNCEMENT: ChatAnnouncementSettings = {
	enabled: false,
	title: "",
	message: "",
};

export default function AdminAnnouncementPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [scopes, setScopes] = useState<SiteSettingsData>(DEFAULT_SCOPES);
	const [announcement, setAnnouncement] = useState<ChatAnnouncementSettings>(
		DEFAULT_ANNOUNCEMENT,
	);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await fetch("/api/admin/site-settings");
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data?.error || "Failed to load announcement");
				}

				if (data.settings) {
					setScopes({
						chat: {
							...DEFAULT_SCOPES.chat,
							...data.settings.chat,
							key: "chat",
						},
						api: {
							...DEFAULT_SCOPES.api,
							...data.settings.api,
							key: "api",
						},
					});
				}

				if (data.announcement) {
					setAnnouncement({
						...DEFAULT_ANNOUNCEMENT,
						...data.announcement,
					});
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to load announcement",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSettings();
	}, []);

	const handleSave = async () => {
		if (
			announcement.enabled &&
			(!announcement.title.trim() || !announcement.message.trim())
		) {
			toast.error("Title and message are required when announcement is enabled");
			return;
		}

		setSaving(true);
		try {
			const response = await fetch("/api/admin/site-settings", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					scopes,
					announcement,
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || "Failed to save announcement");
			}

			setAnnouncement({
				...DEFAULT_ANNOUNCEMENT,
				...data.announcement,
			});
			toast.success("Announcement saved");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save announcement",
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl p-8">
				<p className="text-sm text-gray-500">Loading announcement...</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl space-y-8 p-8">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-2xl">
					<div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
						Announcement Studio
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-gray-900 dark:text-white">
						Publish a clear chat announcement
					</h1>
					<p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
						Siapkan update singkat yang muncul saat user masuk ke chat. Fokus
						pada informasi yang penting, tenang, dan langsung terbaca.
					</p>
				</div>

				<button
					type="button"
					disabled={saving}
					onClick={handleSave}
					className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
				>
					{saving ? "Saving..." : "Publish announcement"}
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-[24px] border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
						Status
					</p>
					<p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
						{announcement.enabled ? "Active" : "Draft"}
					</p>
				</div>
				<div className="rounded-[24px] border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
						Surface
					</p>
					<p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
						Chat workspace
					</p>
				</div>
				<div className="rounded-[24px] border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
						Behavior
					</p>
					<p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
						Once per session
					</p>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
				<div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#0a0a0a] dark:shadow-none">
					<div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-white/10">
						<div>
							<p className="text-sm font-medium text-gray-900 dark:text-white">
								Announcement settings
							</p>
							<p className="mt-1 text-xs text-gray-500">
								Atur visibilitas dan isi modal announcement untuk user chat.
							</p>
						</div>

						<button
							type="button"
							onClick={() =>
								setAnnouncement((current) => ({
									...current,
									enabled: !current.enabled,
								}))
							}
							className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
								announcement.enabled
									? "bg-gray-900 dark:bg-white"
									: "bg-gray-300 dark:bg-white/10"
							}`}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform dark:bg-[#0a0a0a] ${
									announcement.enabled ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					<div className="space-y-6 p-6">
						<div className="rounded-[22px] border border-gray-200 bg-gray-50/80 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
							<p className="text-sm font-medium text-gray-900 dark:text-white">
								{announcement.enabled
									? "Announcement akan tampil saat user masuk chat"
									: "Announcement masih disimpan sebagai draft"}
							</p>
							<p className="mt-1 text-xs leading-6 text-gray-500">
								Production mode aktif normal: user bisa dismiss announcement
								sekali per sesi browser.
							</p>
						</div>

						<div className="space-y-5">
							<label className="block space-y-2">
								<span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
									Headline
								</span>
								<input
									type="text"
									value={announcement.title}
									onChange={(event) =>
										setAnnouncement((current) => ({
											...current,
											title: event.target.value,
										}))
									}
									placeholder="Example: Redeem flow is now cleaner"
									className="w-full rounded-[18px] border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white/30"
								/>
							</label>

							<label className="block space-y-2">
								<span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
									Message
								</span>
								<textarea
									rows={6}
									value={announcement.message}
									onChange={(event) =>
										setAnnouncement((current) => ({
											...current,
											message: event.target.value,
										}))
									}
									placeholder="Write a short, calm update for users entering chat."
									className="w-full resize-none rounded-[20px] border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm leading-7 text-gray-900 outline-none transition-colors focus:border-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white/30"
								/>
							</label>
						</div>
					</div>
				</div>

				<div className="overflow-hidden rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#faf8f3_0%,#f3efe7_100%)] shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#111315_0%,#0d0f10_100%)] dark:shadow-none">
					<div className="border-b border-black/6 px-6 py-5 dark:border-white/10">
						<div className="inline-flex items-center rounded-full border border-black/7 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6e69] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#8f948e]">
							Live preview
						</div>
						<h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[#171717] dark:text-[#f3f4f1]">
							What users will see
						</h2>
						<p className="mt-1 text-sm text-[#666a64] dark:text-[#8f948e]">
							Preview ini meniru modal announcement di halaman chat.
						</p>
					</div>

					<div className="p-6">
						<div className="rounded-[28px] border border-black/8 bg-[#f8f6f1] p-6 text-[#171717] shadow-[0_24px_70px_rgba(17,19,21,0.12)] dark:border-white/10 dark:bg-[#111315] dark:text-[#f3f4f1]">
							<div className="inline-flex items-center rounded-full border border-black/7 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6e69] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#8f948e]">
								Chat update
							</div>
							<h3 className="mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em]">
								{announcement.title.trim() || "Your announcement headline"}
							</h3>
							<p className="mt-3 text-sm leading-7 text-[#5f6258] dark:text-[#9ea59f]">
								{announcement.message.trim() ||
									"Write a clear update here so users instantly understand what changed, what to expect, or what is new in the workspace."}
							</p>
							<div className="mt-6 flex justify-end">
								<button
									type="button"
									className="rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-[#f8f6f1] dark:bg-[#f1eee7] dark:text-[#111315]"
								>
									Got it
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
