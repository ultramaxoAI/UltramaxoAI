"use client";

import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	BarChartIcon,
	CrownIcon,
	KeyIcon,
	LogOutIcon,
	MessageSquareIcon,
	SearchIcon,
	Settings2Icon,
	TicketIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { getEmailWrapper } from "@/lib/email-wrapper";

export default function AdminDashboardClient() {
	const [activeTab, setActiveTab] = useState<
		"vouchers" | "users" | "upgrade-requests" | "insights" | "email-tools"
	>("vouchers");
	const [users, setUsers] = useState<
		{
			id: string;
			email: string;
			name?: string;
			role: string;
			planType: string;
		}[]
	>([]);
	const [upgradeRequests, setUpgradeRequests] = useState<
		{
			id: string;
			userId: string;
			status: string;
			createdAt: string;
			planType: string;
			User?: { email: string };
		}[]
	>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const [voucherData, setVoucherData] = useState({
		code: "",
		type: "PRO",
		value: 0,
		durationMonths: 1,
	});
	const [_voucherMessage, _setVoucherMessage] = useState("");
	const [stats, setStats] = useState<{
		totalUsers: number;
		activeUsers: number;
	}>({ totalUsers: 0, activeUsers: 0 });
	const [insights, setInsights] = useState<{
		realtimeTraffic: {
			path: string;
			totalHits: number;
			uniqueVisitors: number;
		}[];
		authenticatedVisitors: {
			id: string;
			name: string | null;
			email: string | null;
			isPro: boolean;
			chatCount: number;
			messageCount: number;
			lastActiveAt: string | null;
		}[];
	} | null>(null);

	const fetchInsights = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/insights");
			const data = await res.json();
			if (data.success) {
				setInsights({
					realtimeTraffic: data.realtimeTraffic,
					authenticatedVisitors: data.authenticatedVisitors,
				});
			}
		} catch {
			toast.error("Failed to fetch insights");
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/users");
			const data = await res.json();
			if (data.users) {
				setUsers(data.users);
			}
		} catch {
			toast.error("Failed to fetch users");
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchUpgradeRequests = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/upgrade-requests");
			const data = await res.json();
			if (data.requests) {
				setUpgradeRequests(data.requests);
			}
		} catch {
			toast.error("Failed to fetch upgrade requests");
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/stats");
			const data = await res.json();
			if (data) {
				setStats(data);
			}
		} catch {
			console.error("Failed to fetch stats");
		}
	}, []);

	useEffect(() => {
		if (activeTab === "users") {
			fetchUsers();
			fetchStats();
		} else if (activeTab === "upgrade-requests") {
			fetchUpgradeRequests();
		} else if (activeTab === "insights") {
			fetchInsights();
		}
	}, [activeTab, fetchInsights, fetchStats, fetchUpgradeRequests, fetchUsers]);

	const handleVoucherSubmit = async () => {
		try {
			const res = await fetch("/api/admin/vouchers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(voucherData),
			});
			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
			} else {
				toast.success("Voucher created successfully!");
				setVoucherData({ ...voucherData, code: "" });
			}
		} catch {
			toast.error("Error creating voucher");
		}
	};

	const handleUpdateUser = async (
		userId: string,
		updates: Record<string, unknown>,
	) => {
		try {
			const res = await fetch("/api/admin/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: userId, ...updates }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("User updated");
				fetchUsers();
			} else {
				toast.error(data.error || "Update failed");
			}
		} catch {
			toast.error("Update failed");
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (
			!window.confirm(
				"Are you sure you want to delete this user? This action cannot be undone.",
			)
		) {
			return;
		}

		try {
			const res = await fetch(`/api/admin/users?id=${userId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.success) {
				toast.success("User deleted");
				fetchUsers();
			} else {
				toast.error(data.error || "Delete failed");
			}
		} catch {
			toast.error("Delete failed");
		}
	};

	/* EMAIL TOOLS STATE */
	const [emailData, setEmailData] = useState({
		recipientType: "single", // 'single' | 'all' | 'pro' | 'free'
		email: "",
		name: "",
		type: "upgrade-reminder",
		subject: "",
		message: "",
	});
	const [selectedTemplate, setSelectedTemplate] = useState("custom");

	// Auto-fill content when template changes
	useEffect(() => {
		const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);
		if (template && selectedTemplate !== "custom") {
			setEmailData((prev) => ({
				...prev,
				type: "custom", // Force type to custom so we can edit content
				subject: template.subject,
				message: template.body,
			}));
		}
	}, [selectedTemplate]);

	const handleSendEmail = async () => {
		if (emailData.recipientType === "single" && !emailData.email) {
			toast.error("Email is required for single recipient");
			return;
		}

		if (
			emailData.recipientType !== "single" &&
			!window.confirm(
				`Are you sure you want to broadcast this email to ${emailData.recipientType.toUpperCase()} users? This action cannot be undone.`,
			)
		) {
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/admin/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(emailData),
			});
			const data = await res.json();

			if (data.success) {
				if (emailData.recipientType === "single") {
					toast.success("Email sent successfully!");
				} else {
					toast.success(
						`Broadcast complete! Sent: ${data.meta?.sent}, Failed: ${data.meta?.failed}`,
					);
				}
				setEmailData({
					...emailData,
					email: "",
					name: "",
					subject: "",
					message: "",
				});
			} else {
				toast.error(data.error || "Failed to send email");
			}
		} catch {
			toast.error("Error sending email");
		} finally {
			setLoading(false);
		}
	};

	const filteredUsers = users.filter(
		(u) =>
			u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.id?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const tabs = [
		{ id: "vouchers", label: "Vouchers", icon: <TicketIcon size={18} /> },
		{ id: "insights", label: "Insights", icon: <BarChartIcon size={18} /> },
		{ id: "users", label: "Users", icon: <UsersIcon size={18} /> },
		{
			id: "upgrade-requests",
			label: "Requests",
			icon: <CrownIcon size={18} />,
		},
		{
			id: "email-tools",
			label: "Email",
			icon: <MessageSquareIcon size={18} />,
		},
	] as const;

	return (
		<div className="flex flex-col md:flex-row h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans">
			{/* Mobile Header */}
			<header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/30">
				<Link
					href="/chat"
					className="flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
				>
					<ArrowLeft size={18} />
				</Link>
				<h1 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
					Admin OS
				</h1>
				<div className="w-[18px]" />
			</header>

			{/* Desktop Sidebar */}
			<aside className="hidden md:flex w-56 border-r border-zinc-200 dark:border-zinc-800/50 flex-col p-6 gap-6 bg-white dark:bg-zinc-900/30 shrink-0">
				<div className="flex flex-col gap-6">
					<Link
						href="/chat"
						className="flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
					>
						<ArrowLeft size={16} />
						Back to Chat
					</Link>
					<div className="flex items-center gap-3 px-2">
						<div className="size-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
							<Settings2Icon className="text-white dark:text-black size-5" />
						</div>
						<span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
							Admin OS
						</span>
					</div>
				</div>

				<nav className="flex flex-col gap-1.5">
					<h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2 px-2">
						Management
					</h2>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
								activeTab === tab.id
									? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-semibold ring-1 ring-indigo-200 dark:ring-indigo-500/30"
									: "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
							}`}
							onClick={() => setActiveTab(tab.id as any)}
						>
							{tab.icon}
							{tab.label}
						</button>
					))}
				</nav>

				<div className="mt-auto">
					<button
						type="button"
						className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all w-full text-sm font-medium leading-none"
					>
						<LogOutIcon size={18} />
						Exit Admin
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col px-4 py-6 md:p-8 lg:p-12 pb-24 md:pb-8 gap-8 overflow-y-auto min-w-0">
				<header className="flex flex-col gap-1">
					<h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white capitalize">
						{activeTab
							.split("-")
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(" ")}{" "}
						Management
					</h1>
					<p className="text-zinc-500 text-sm">
						Manage your application's {activeTab.replace("-", " ")} activity and
						settings.
					</p>
				</header>

				{activeTab === "vouchers" ? (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<section className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
							<div className="flex flex-col gap-1.5">
								<h2 className="text-xl font-bold text-zinc-900 dark:text-white">
									Generate Voucher
								</h2>
								<p className="text-zinc-500 text-sm">
									Create a new redeemable code for users.
								</p>
							</div>

							<div className="space-y-5">
								<div className="space-y-2">
									<label
										htmlFor="voucher_code"
										className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
									>
										Voucher Code
									</label>
									<input
										id="voucher_code"
										className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
										onChange={(e) =>
											setVoucherData({ ...voucherData, code: e.target.value })
										}
										placeholder="e.g. ULTIMA-PRO-2025"
										value={voucherData.code}
									/>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="voucher_type"
										className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
									>
										Voucher Type
									</label>
									<select
										id="voucher_type"
										className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none appearance-none"
										onChange={(e) =>
											setVoucherData({ ...voucherData, type: e.target.value })
										}
										value={voucherData.type}
									>
										<option value="PRO">PRO Subscription</option>
										<option value="CREDIT">Extra Credits</option>
									</select>
								</div>

								{voucherData.type === "PRO" ? (
									<div className="space-y-2 animate-in fade-in slide-in-from-top-2">
										<label
											htmlFor="voucher_duration"
											className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
										>
											Duration (Months)
										</label>
										<input
											id="voucher_duration"
											className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
											onChange={(e) =>
												setVoucherData({
													...voucherData,
													durationMonths: Number.parseInt(e.target.value, 10),
												})
											}
											type="number"
											value={voucherData.durationMonths}
										/>
									</div>
								) : (
									<div className="space-y-2 animate-in fade-in slide-in-from-top-2">
										<label
											htmlFor="voucher_credit"
											className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
										>
											Credit Amount
										</label>
										<input
											id="voucher_credit"
											className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
											onChange={(e) =>
												setVoucherData({
													...voucherData,
													value: Number.parseInt(e.target.value, 10),
												})
											}
											type="number"
											value={voucherData.value}
										/>
									</div>
								)}

								<button
									type="button"
									className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-bold py-4 rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl mt-4"
									onClick={handleVoucherSubmit}
								>
									Create Voucher
								</button>
							</div>
						</section>

						<section className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-[#121214]/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
							<div className="text-center flex flex-col items-center gap-4">
								<div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
									<TicketIcon
										className="text-zinc-400 dark:text-zinc-600"
										size={32}
									/>
								</div>
								<p className="text-zinc-500 dark:text-zinc-600 text-sm max-w-[200px]">
									Active vouchers and history will appear here in the next
									update.
								</p>
							</div>
						</section>
					</div>
				) : activeTab === "insights" ? (
					<div className="flex flex-col gap-6">
						<h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
							Lalu Lintas Semua Pengunjung (24 Jam)
						</h2>

						{/* Aggregate Total Card */}
						{insights?.realtimeTraffic &&
							insights.realtimeTraffic.length > 0 && (
								<div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden group mb-2 shadow-xl">
									<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
										<BarChartIcon className="text-blue-500" size={80} />
									</div>
									<h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
										TOTAL KESELURUHAN WEBSITE
									</h3>
									<div className="flex items-end gap-6 mt-2">
										<div>
											<p className="text-5xl font-black text-zinc-900 dark:text-white">
												{insights.realtimeTraffic.reduce(
													(acc, curr) => acc + Number(curr.totalHits),
													0,
												)}
											</p>
											<p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1">
												Total Dilihat
											</p>
										</div>
										<div>
											<p className="text-5xl font-black text-blue-500 dark:text-blue-400">
												{insights.realtimeTraffic.reduce(
													(acc, curr) => acc + Number(curr.uniqueVisitors),
													0,
												)}
											</p>
											<p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1">
												Jumlah Orang (Unik)
											</p>
										</div>
									</div>
								</div>
							)}

						<h3 className="text-sm font-bold text-zinc-500 mt-2 mb-1">
							Rincian per Halaman:
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
							{insights?.realtimeTraffic?.map((traffic) => (
								<div
									className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 p-6 rounded-3xl relative overflow-hidden group shadow-sm dark:shadow-none"
									key={traffic.path}
								>
									<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
										<BarChartIcon size={60} />
									</div>
									<h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
										Halaman: {traffic.path || "/"}
									</h3>
									<div className="flex items-end gap-4 mt-2">
										<div>
											<p className="text-4xl font-black text-zinc-900 dark:text-white">
												{traffic.totalHits}
											</p>
											<p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mt-1">
												Total Dilihat
											</p>
										</div>
										<div>
											<p className="text-4xl font-black text-blue-500 dark:text-blue-400">
												{traffic.uniqueVisitors}
											</p>
											<p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mt-1">
												Jumlah Orang (Unik)
											</p>
										</div>
									</div>
								</div>
							))}
							{!insights?.realtimeTraffic?.length && !loading && (
								<div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 p-6 rounded-3xl col-span-2 text-center text-zinc-500 py-12">
									Belum ada kunjungan ke halaman mana pun dalam 24 jam terakhir.
								</div>
							)}
						</div>

						<h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-2">
							Aktivitas Pengguna (Yang Sudah Login)
						</h2>
						<div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
												Nama & Email
											</th>
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap text-center">
												Total Chat
											</th>
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap text-center">
												Total Pesan
											</th>
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">
												Terakhir Aktif
											</th>
										</tr>
									</thead>
									<tbody>
										{insights?.authenticatedVisitors?.map((user) => (
											<tr
												className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
												key={user.id}
											>
												<td className="p-4">
													<div className="flex flex-col">
														<span className="font-bold text-sm text-zinc-900 dark:text-white">
															{user.name || "Unknown"}
														</span>
														<span className="text-xs text-zinc-500">
															{user.email}
														</span>
														{user.isPro && (
															<span className="text-[10px] bg-yellow-100 dark:bg-amber-500/10 text-yellow-600 dark:text-amber-500 border border-yellow-200 dark:border-amber-500/20 uppercase font-bold px-2 py-0.5 rounded-full w-max mt-1">
																Pro
															</span>
														)}
													</div>
												</td>
												<td className="p-4 text-center text-sm font-medium text-zinc-900 dark:text-white">
													{user.chatCount}
												</td>
												<td className="p-4 text-center text-sm font-medium text-zinc-900 dark:text-white">
													{user.messageCount}
												</td>
												<td className="p-4 text-right text-xs text-zinc-500 dark:text-zinc-400">
													{user.lastActiveAt
														? formatDistanceToNow(new Date(user.lastActiveAt), {
																addSuffix: true,
															})
																.replace("about", "sekitar")
																.replace("less than a minute ago", "baru saja")
																.replace("minute", "menit")
																.replace("minutes", "menit")
																.replace("hour", "jam")
																.replace("hours", "jam")
																.replace("day", "hari")
																.replace("days", "hari")
																.replace("month", "bulan")
																.replace("months", "bulan")
																.replace("year", "tahun")
																.replace("years", "tahun")
																.replace("ago", "yang lalu")
														: "Belum Pernah"}
												</td>
											</tr>
										))}
										{!insights?.authenticatedVisitors?.length && !loading && (
											<tr>
												<td
													className="p-8 text-center text-zinc-500 text-sm"
													colSpan={4}
												>
													Belum ada aktivitas dari pengguna yang login.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "users" ? (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
							<div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 p-6 rounded-3xl relative overflow-hidden group shadow-sm dark:shadow-none">
								<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
									<UsersIcon size={60} />
								</div>
								<h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
									Total Users
								</h3>
								<p className="text-4xl font-black text-zinc-900 dark:text-white">
									{stats.totalUsers}
								</p>
							</div>
							<div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 p-6 rounded-3xl relative overflow-hidden group shadow-sm dark:shadow-none">
								<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
									<MessageSquareIcon size={60} />
								</div>
								<h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
									Active Users (24h)
								</h3>
								<p className="text-4xl font-black text-green-600 dark:text-green-400">
									{stats.activeUsers}
								</p>
							</div>
						</div>
						<div className="flex justify-between items-center bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-2 px-6 shadow-sm dark:shadow-none">
							<div className="flex items-center gap-3 flex-1 max-w-md">
								<SearchIcon className="text-zinc-500" size={18} />
								<input
									className="bg-transparent w-full py-4 text-sm focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search users by name or email..."
									value={searchQuery}
								/>
							</div>
							<button
								type="button"
								className="text-white bg-zinc-900 dark:bg-zinc-800 py-2 px-4 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
								onClick={fetchUsers}
							>
								Refresh
							</button>
						</div>

						<div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
												User
											</th>
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
												Usage & Limit
											</th>
											<th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right whitespace-nowrap">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
										{loading ? (
											<tr>
												<td
													className="p-20 text-center text-zinc-500"
													colSpan={6}
												>
													<div className="animate-pulse flex flex-col items-center gap-4">
														<div className="size-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
														<span className="text-sm">
															Retrieving user records...
														</span>
													</div>
												</td>
											</tr>
										) : filteredUsers.length === 0 ? (
											<tr>
												<td
													className="p-20 text-center text-zinc-600"
													colSpan={6}
												>
													No users found.
												</td>
											</tr>
										) : (
											filteredUsers.map((user: any) => (
												<tr
													className="hover:bg-zinc-800/20 transition-colors group"
													key={user.id}
												>
													<td className="p-4 max-w-[200px] sm:max-w-none">
														<div className="flex items-center gap-3">
															<div className="size-8 sm:size-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 shrink-0">
																{user.name?.[0]?.toUpperCase() ||
																	user.email?.[0]?.toUpperCase()}
															</div>
															<div className="flex flex-col min-w-0 gap-1 text-left">
																<div className="flex items-center gap-2 flex-wrap">
																	<span className="font-bold text-white text-sm truncate max-w-[120px] sm:max-w-[200px]">
																		{user.name || "Unnamed"}
																	</span>
																	{user.isPro && (
																		<span className="px-1.5 py-0.5 bg-yellow-400/10 text-yellow-400 text-[9px] font-black uppercase tracking-widest border border-yellow-400/20 rounded-full flex items-center gap-1 w-fit shrink-0">
																			<CrownIcon size={8} /> PRO
																		</span>
																	)}
																	{user.role === "admin" && (
																		<span className="px-1.5 py-0.5 bg-blue-400/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-400/20 rounded-full flex items-center gap-1 w-fit shrink-0">
																			<KeyIcon size={8} /> ADMIN
																		</span>
																	)}
																</div>
																<span className="text-zinc-500 text-xs truncate max-w-[150px] sm:max-w-[250px]">
																	{user.email}
																</span>
															</div>
														</div>
													</td>
													<td className="p-4">
														<div className="flex flex-col gap-1.5">
															<div className="flex items-center gap-2 text-zinc-300 font-medium whitespace-nowrap">
																<MessageSquareIcon
																	className="text-zinc-500"
																	size={14}
																/>
																<span className="text-sm">
																	{user.todayMessageCount || 0} / 10
																</span>
															</div>
															<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
																{user.isPro
																	? "Unlimited Plan"
																	: user.limitCount && user.limitCount > 0
																		? `Total Limit: ${user.limitCount + 10}`
																		: "Free Plan"}
															</span>
														</div>
													</td>
													<td className="p-4 text-right">
														<div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 sm:gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
															<button
																type="button"
																className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-all shadow-lg border border-zinc-200 dark:border-zinc-700/50"
																onClick={() =>
																	handleUpdateUser(user.id, {
																		isPro: !user.isPro,
																		limitCount: user.isPro ? 0 : 99_999,
																	})
																}
																title={user.isPro ? "Revoke Pro" : "Grant Pro"}
															>
																{user.isPro ? (
																	<TicketIcon size={16} />
																) : (
																	<CrownIcon size={16} />
																)}
															</button>
															<button
																type="button"
																className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-all shadow-lg border border-zinc-200 dark:border-zinc-700/50"
																onClick={() => {
																	// Pre-fill email in Email Tools
																	setEmailData({
																		...emailData,
																		recipientType: "single",
																		email: user.email,
																		name: user.name || "",
																	});
																	setActiveTab("email-tools" as any);
																}}
																title="Send Email"
															>
																<MessageSquareIcon size={16} />
															</button>
															<button
																type="button"
																className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-all shadow-lg border border-zinc-200 dark:border-zinc-700/50"
																onClick={() => {
																	const newLimit = prompt(
																		"Enter new limit count:",
																		user.limitCount,
																	);
																	if (newLimit !== null) {
																		handleUpdateUser(user.id, {
																			limitCount: Number.parseInt(newLimit, 10),
																		});
																	}
																}}
																title="Edit Limit"
															>
																<Settings2Icon size={16} />
															</button>
															<button
																type="button"
																className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-all shadow-lg border border-zinc-200 dark:border-zinc-700/50"
																onClick={() => handleDeleteUser(user.id)}
																title="Delete User"
															>
																<Trash2Icon size={16} />
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "upgrade-requests" ? (
					<div className="flex flex-col gap-6">
						<div className="bg-[#121214] border border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="bg-zinc-900/50 border-b border-zinc-800">
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												User
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												Plan
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												Duration
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												Price
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												Status
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
												Date
											</th>
											<th className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-widest text-right">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{loading ? (
											<tr>
												<td
													className="p-8 text-center text-zinc-500"
													colSpan={7}
												>
													Loading upgrade requests...
												</td>
											</tr>
										) : upgradeRequests.length === 0 ? (
											<tr>
												<td
													className="p-8 text-center text-zinc-500"
													colSpan={7}
												>
													No upgrade requests yet
												</td>
											</tr>
										) : (
											upgradeRequests.map((request: any) => (
												<tr
													className="hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/30"
													key={request.id}
												>
													<td className="p-4">
														<div className="flex flex-col">
															<span className="font-bold text-white text-sm">
																{request.username || "Unnamed"}
															</span>
															<span className="text-zinc-500 text-xs">
																{request.email}
															</span>
														</div>
													</td>
													<td className="p-4">
														<span className="text-zinc-300 font-medium text-sm">
															{request.planId}
														</span>
													</td>
													<td className="p-4">
														<span className="text-zinc-300 font-medium">
															{request.months} bulan
														</span>
													</td>
													<td className="p-4">
														<span className="text-yellow-400 font-bold">
															Rp {request.price?.toLocaleString("id-ID")}
														</span>
													</td>
													<td className="p-4">
														{request.status === "approved" ? (
															<span className="px-2.5 py-0.5 bg-green-400/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-400/20 rounded-full w-fit">
																Approved
															</span>
														) : request.status === "rejected" ? (
															<span className="px-2.5 py-0.5 bg-red-400/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-400/20 rounded-full w-fit">
																Rejected
															</span>
														) : (
															<span className="px-2.5 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/20 rounded-full w-fit">
																Pending
															</span>
														)}
													</td>
													<td className="p-4">
														<span className="text-zinc-500 text-xs">
															{new Date(request.createdAt).toLocaleDateString(
																"id-ID",
															)}
														</span>
													</td>
													<td className="p-4 text-right">
														{request.status === "pending" && (
															<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
																<button
																	type="button"
																	className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold transition-all border border-green-500/30"
																	onClick={async () => {
																		try {
																			const res = await fetch(
																				"/api/admin/upgrade-requests",
																				{
																					method: "PATCH",
																					headers: {
																						"Content-Type": "application/json",
																					},
																					body: JSON.stringify({
																						requestId: request.id,
																						status: "approved",
																					}),
																				},
																			);
																			const data = await res.json();
																			if (data.success) {
																				toast.success(
																					"✅ Request approved! User upgraded to PRO. User perlu refresh page untuk melihat perubahan.",
																				);
																				fetchUpgradeRequests();
																			} else {
																				toast.error(
																					data.error || "Approval failed",
																				);
																			}
																		} catch (_e) {
																			toast.error("Approval failed");
																		}
																	}}
																>
																	Approve
																</button>
																<button
																	type="button"
																	className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all border border-red-500/30"
																	onClick={async () => {
																		try {
																			const res = await fetch(
																				"/api/admin/upgrade-requests",
																				{
																					method: "PATCH",
																					headers: {
																						"Content-Type": "application/json",
																					},
																					body: JSON.stringify({
																						requestId: request.id,
																						status: "rejected",
																					}),
																				},
																			);
																			const data = await res.json();
																			if (data.success) {
																				toast.success("Request rejected");
																				fetchUpgradeRequests();
																			} else {
																				toast.error(
																					data.error || "Rejection failed",
																				);
																			}
																		} catch (_e) {
																			toast.error("Rejection failed");
																		}
																	}}
																>
																	Reject
																</button>
															</div>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : (activeTab as any) === "email-tools" ? (
					<div className="grid grid-cols-1 gap-8">
						<section className="bg-[#121214] border border-zinc-800/50 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
							<div className="flex flex-col gap-1.5">
								<h2 className="text-xl font-bold text-white">
									Send Email / Broadcast
								</h2>
								<p className="text-zinc-500 text-sm">
									Send templated emails to single user or broadcast to groups.
								</p>
							</div>

							<div className="space-y-5 max-w-2xl">
								<div className="space-y-2">
									<label
										htmlFor="target_plan"
										className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
									>
										Target Audience
									</label>
									<select
										id="target_plan"
										className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none appearance-none"
										onChange={(e) =>
											setEmailData({
												...emailData,
												recipientType: e.target.value,
											})
										}
										value={emailData.recipientType}
									>
										<option value="single">Specific User (Single)</option>
										<option value="all">📢 All Users (Broadcast)</option>
										<option value="pro">👑 PRO Users Only</option>
										<option value="free">🆓 FREE Users Only</option>
									</select>
								</div>

								{emailData.recipientType === "single" && (
									<div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
										<div className="space-y-2">
											<label
												htmlFor="recipient_email"
												className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
											>
												Recipient Email
											</label>
											<input
												id="recipient_email"
												className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
												onChange={(e) =>
													setEmailData({ ...emailData, email: e.target.value })
												}
												placeholder="user@example.com"
												value={emailData.email}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="recipient_name"
												className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
											>
												Recipient Name
											</label>
											<input
												id="recipient_name"
												className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
												onChange={(e) =>
													setEmailData({ ...emailData, name: e.target.value })
												}
												placeholder="John Doe"
												value={emailData.name}
											/>
										</div>
									</div>
								)}

								<div className="space-y-2">
									<label
										htmlFor="email_template"
										className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
									>
										Email Template
									</label>
									<select
										id="email_template"
										className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none appearance-none"
										onChange={(e) => setSelectedTemplate(e.target.value)}
										value={selectedTemplate}
									>
										{EMAIL_TEMPLATES.map((template) => (
											<option key={template.id} value={template.id}>
												{template.name}
											</option>
										))}
									</select>
								</div>

								{/* Always show editor for Custom or any Template (since they become custom on select) */}
								<div className="space-y-4 animate-in fade-in slide-in-from-top-2">
									<div className="space-y-2">
										<label
											htmlFor="email_subject"
											className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Subject Line
										</label>
										<input
											id="email_subject"
											className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all font-medium"
											onChange={(e) =>
												setEmailData({
													...emailData,
													subject: e.target.value,
													type: "custom",
												})
											}
											placeholder="Email Subject"
											value={emailData.subject}
										/>
									</div>

									<div className="space-y-2">
										<label
											htmlFor="email_content"
											className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Email Content (Markdown supported)
										</label>
										<textarea
											id="email_content"
											className="w-full bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all min-h-[200px] font-mono leading-relaxed"
											onChange={(e) =>
												setEmailData({
													...emailData,
													message: e.target.value,
													type: "custom",
												})
											}
											placeholder="<p>Write your message here...</p>"
											value={emailData.message}
										/>
										<p className="text-xs text-zinc-500 ml-1">
											* Supports basic HTML tags like &lt;p&gt;, &lt;strong&gt;,
											&lt;ul&gt;, &lt;li&gt;, etc.
										</p>
									</div>
								</div>

								{/* Live Preview Section */}
								<div className="mt-8 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
									<div className="bg-[#0c0c0e] px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div className="size-2 rounded-full bg-green-500 animate-pulse" />
											<span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
												Live Preview
											</span>
										</div>
										<span className="text-xs text-zinc-600 font-mono">
											Rendering...
										</span>
									</div>
									<div className="bg-[#18181b] p-4 flex justify-center min-h-[400px]">
										<div className="w-full max-w-[650px] bg-transparent rounded-xl overflow-hidden shadow-sm">
											<iframe
												className="w-full h-[600px] bg-transparent border-none"
												srcDoc={getEmailWrapper(
													emailData.message ||
														"<p style='text-align:center; color: #666; margin-top: 100px;'>Start typing to verify preview...</p>",
												)}
												title="Email Preview"
											/>
										</div>
									</div>
								</div>

								<button
									className={`w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${emailData.recipientType !== "single" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white hover:bg-zinc-200 text-black"}`}
									disabled={loading}
									onClick={handleSendEmail}
								>
									{loading ? (
										<div className="size-4 rounded-full border-2 border-zinc-300 border-t-zinc-800 animate-spin" />
									) : (
										<MessageSquareIcon size={18} />
									)}
									{emailData.recipientType !== "single"
										? `Broadcast to ${emailData.recipientType.toUpperCase()} Users`
										: "Send Email"}
								</button>
							</div>
						</section>
					</div>
				) : null}
			</main>

			{/* Mobile Bottom Tab Bar */}
			<nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg py-2 safe-bottom">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
							activeTab === tab.id
								? "text-indigo-600 dark:text-indigo-400"
								: "text-zinc-400 dark:text-zinc-600"
						}`}
						onClick={(e) => {
							e.preventDefault();
							setActiveTab(tab.id as any);
						}}
					>
						<span
							className={`flex items-center justify-center size-8 rounded-full transition-all duration-200 ${
								activeTab === tab.id
									? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 scale-110"
									: "hover:bg-zinc-100 dark:hover:bg-zinc-800"
							}`}
						>
							{tab.icon}
						</span>
						<span className="truncate max-w-[60px] text-center">
							{tab.label}
						</span>
					</button>
				))}
			</nav>
		</div>
	);
}
