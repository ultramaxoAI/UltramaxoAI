"use client";

import {
	Loader2Icon,
	LockIcon,
	ShieldCheckIcon,
	UserIcon,
	ZapIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SettingsUser {
	email?: string | null;
	isPro?: boolean;
	messageCount?: number;
}

export function SettingsDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
	const [user, setUser] = useState<SettingsUser | null>(null);
	const [loading, setLoading] = useState(false);

	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [updateLoading, setUpdateLoading] = useState(false);

	const fetchUserData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/settings");
			const data = await res.json();
			if (data.user) {
				setUser(data.user);
			}
		} catch (_e) {
			toast.error("Gagal mengambil data user");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open) {
			fetchUserData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, fetchUserData]);

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("Password konfirmasi tidak cocok");
			return;
		}

		setUpdateLoading(true);
		try {
			const res = await fetch("/api/user/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				}),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Password berhasil diubah");
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			} else {
				toast.error(data.error || "Gagal mengubah password");
			}
		} catch (_e) {
			toast.error("Terjadi kesalahan");
		} finally {
			setUpdateLoading(false);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl">
				<div className="flex h-[500px]">
					{/* Sidebar Tabs */}
					<aside className="w-40 border-r border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/20 p-4 flex flex-col gap-2">
						<button
							className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${activeTab === "profile" ? "bg-zinc-900 text-white dark:bg-white dark:text-black font-bold shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"}`}
							onClick={() => setActiveTab("profile")}
							type="button"
						>
							<UserIcon size={16} />
							Profil
						</button>
						<button
							className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${activeTab === "security" ? "bg-zinc-900 text-white dark:bg-white dark:text-black font-bold shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"}`}
							onClick={() => setActiveTab("security")}
							type="button"
						>
							<LockIcon size={16} />
							Keamanan
						</button>
					</aside>

					{/* Tab Content */}
					<main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
						<header className="flex flex-col gap-1">
							<DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white leading-none">
								{activeTab === "profile" ? "Informasi Akun" : "Ganti Password"}
							</DialogTitle>
							<p className="text-zinc-500 text-xs">
								{activeTab === "profile"
									? "Liat detail profil dan sisa kuota chat kamu."
									: "Perbarui password akun kamu secara berkala."}
							</p>
						</header>

						{loading ? (
							<div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500">
								<Loader2Icon className="animate-spin" size={32} />
								<span className="text-sm">Memuat data...</span>
							</div>
						) : activeTab === "profile" ? (
							<div className="flex flex-col gap-6">
								<div className="space-y-4">
									<div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
										<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
											Email Address
										</Label>
										<div className="text-sm text-zinc-900 dark:text-white font-medium truncate">
											{user?.email || "N/A"}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
											<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
												Tier Status
											</Label>
											<div className="flex items-center gap-2">
												{user?.isPro ? (
													<span className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 rounded-full font-bold border border-yellow-500/20">
														PRO
													</span>
												) : (
													<span className="text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 rounded-full font-bold">
														FREE
													</span>
												)}
											</div>
										</div>
										<div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
											<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
												Chat Quota
											</Label>
											<div className="flex flex-col gap-0.5">
												<div className="flex items-center gap-1.5 text-sm text-zinc-900 dark:text-white font-bold">
													<ZapIcon
														className="text-blue-500 fill-blue-500"
														size={14}
													/>
													{user?.isPro
														? "Unlimited"
														: `${Math.max(0, 10 - (user?.messageCount || 0))} / 10`}
												</div>
												<span className="text-[9px] text-zinc-600 font-medium">
													Resets every 24h
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className="mt-4 p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 flex items-start gap-4">
									<div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
										<ShieldCheckIcon size={20} />
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-xs font-bold text-zinc-900 dark:text-white">
											Akun kamu aman
										</span>
										<p className="text-[10px] text-zinc-600 dark:text-zinc-500 leading-relaxed">
											Gunakan fitur ini untuk memantau sisa kuota chat kamu
											secara real-time.
										</p>
									</div>
								</div>
							</div>
						) : activeTab === "security" ? (
							<form
								className="flex flex-col gap-5"
								onSubmit={handlePasswordChange}
							>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
											Password Saat Ini
										</Label>
										<Input
											className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-300 dark:focus:ring-zinc-700"
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													currentPassword: e.target.value,
												})
											}
											placeholder="••••••••"
											required
											type="password"
											value={passwordData.currentPassword}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
											Password Baru
										</Label>
										<Input
											className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-300 dark:focus:ring-zinc-700"
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													newPassword: e.target.value,
												})
											}
											placeholder="••••••••"
											required
											type="password"
											value={passwordData.newPassword}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
											Konfirmasi Password Baru
										</Label>
										<Input
											className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm focus:ring-zinc-300 dark:focus:ring-zinc-700"
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													confirmPassword: e.target.value,
												})
											}
											placeholder="••••••••"
											required
											type="password"
											value={passwordData.confirmPassword}
										/>
									</div>
								</div>

								<Button
									className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-bold h-11 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] mt-2 shadow-xl"
									disabled={updateLoading}
									type="submit"
								>
									{updateLoading ? (
										<Loader2Icon className="animate-spin" size={18} />
									) : (
										"Perbarui Password"
									)}
								</Button>
							</form>
						) : null}
					</main>
				</div>
			</DialogContent>
		</Dialog>
	);
}
