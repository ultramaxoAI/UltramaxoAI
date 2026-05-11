"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, Crown, Search, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AdminUser {
	id: string;
	name: string | null;
	email: string;
	role: string;
	isPro: boolean;
	limitCount: number;
	createdAt: string;
	chatCount: number;
	messageCount: number;
	todayMessageCount: number;
}

const USERS_PER_PAGE = 15;

export default function AdminUsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/admin/users", {
					headers: { "Cache-Control": "no-cache" },
				});
				const data = await res.json();
				if (data.users) {
					setUsers(data.users);
				}
			} catch {
				toast.error("Failed to fetch users");
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	// Reset to page 1 when search changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery]);

	const handleDeleteUser = async (userId: string) => {
		if (!window.confirm("Are you sure you want to delete this user?")) return;
		try {
			const res = await fetch(`/api/admin/users?id=${userId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.success) {
				toast.success("User deleted");
				setUsers(users.filter((u) => u.id !== userId));
			} else {
				toast.error(data.error || "Delete failed");
			}
		} catch {
			toast.error("Delete failed");
		}
	};

	const handleTogglePro = async (user: AdminUser) => {
		const isCurrentlyPro = user.isPro;

		let updates: Record<string, unknown> = {};

		if (isCurrentlyPro) {
			if (!window.confirm("Revoke PRO status for this user?")) return;
			updates = { isPro: false, limitCount: 5, proExpiresAt: null };
		} else {
			const duration = window.prompt(
				"Grant PRO status. Enter duration in months (1, 6, 12) or type 'lifetime':",
				"12",
			);
			if (!duration) return;

			if (duration.toLowerCase().trim() === "lifetime") {
				updates = { isPro: true, limitCount: 99999, proExpiresAt: null };
			} else {
				const months = Number.parseInt(duration, 10);
				if (Number.isNaN(months) || months <= 0) {
					toast.error("Invalid duration entered.");
					return;
				}
				const expiryDate = new Date();
				expiryDate.setMonth(expiryDate.getMonth() + months);
				updates = {
					isPro: true,
					limitCount: 99999,
					proExpiresAt: expiryDate.toISOString(),
				};
			}
		}

		try {
			const res = await fetch("/api/admin/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: user.id, ...updates }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success(isCurrentlyPro ? "PRO Revoked" : "PRO Granted");
				setUsers(
					users.map((u) =>
						u.id === user.id ? ({ ...u, ...updates } as AdminUser) : u,
					),
				);
			} else {
				toast.error(data.error || "Update failed");
			}
		} catch {
			toast.error("Update failed");
		}
	};

	const filteredUsers = users.filter(
		(u) =>
			u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Pagination
	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
	const safePage = Math.min(currentPage, totalPages);
	const startIndex = (safePage - 1) * USERS_PER_PAGE;
	const endIndex = startIndex + USERS_PER_PAGE;
	const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
						Users
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						{loading
							? "Loading..."
							: `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} total`}
					</p>
				</div>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search users..."
						className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left">
						<thead className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							<tr>
								<th className="px-6 py-4 font-medium">User</th>
								<th className="px-6 py-4 font-medium">Role</th>
								<th className="px-6 py-4 font-medium">Plan</th>
								<th className="px-6 py-4 font-medium">Usage</th>
								<th className="px-6 py-4 font-medium">Joined</th>
								<th className="px-6 py-4 font-medium text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-white/10">
							{loading ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-gray-500"
									>
										Loading user data...
									</td>
								</tr>
							) : paginatedUsers.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-gray-500"
									>
										No users found.
									</td>
								</tr>
							) : (
								paginatedUsers.map((user) => {
									const today = user.todayMessageCount ?? 0;
									const bonus = user.limitCount ?? 0;
									const dailyLimit = 10;
									const isHigh = today >= dailyLimit;
									const isNearLimit = today >= dailyLimit - 2;

									return (
										<tr
											key={user.id}
											className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors"
										>
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className="size-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs shrink-0">
														{user.email.charAt(0).toUpperCase()}
													</div>
													<div>
														<p className="font-medium text-gray-900 dark:text-white">
															{user.name || "Anonymous"}
														</p>
														<p className="text-xs text-gray-500 mt-0.5">
															{user.email}
														</p>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												{user.role === "admin" ? (
													<span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
														<ShieldAlert size={12} /> Admin
													</span>
												) : (
													<span className="text-gray-600 dark:text-gray-400 text-xs">
														Standard
													</span>
												)}
											</td>
											<td className="px-6 py-4">
												{user.isPro ? (
													<span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md">
														<Crown size={12} /> PRO
													</span>
												) : (
													<span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md">
														Free
													</span>
												)}
											</td>
											<td className="px-6 py-4">
												{user.isPro ? (
													<span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
														Unlimited
													</span>
												) : (
													<div className="flex flex-col gap-1">
														<span
															className={`text-xs font-mono font-semibold ${
																isHigh
																	? "text-red-500"
																	: isNearLimit
																		? "text-amber-500"
																		: "text-gray-700 dark:text-gray-300"
															}`}
														>
															{today}/{dailyLimit}
														</span>
														{bonus > 0 && (
															<span className="text-[10px] text-emerald-500">
																+{bonus} bonus
															</span>
														)}
													</div>
												)}
											</td>
											<td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
												{user.createdAt
													? formatDistanceToNow(new Date(user.createdAt), {
															addSuffix: true,
														})
													: "Unknown"}
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => handleTogglePro(user)}
														className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
														title={user.isPro ? "Revoke Pro" : "Make Pro"}
													>
														{user.isPro ? (
															<Sparkles
																size={16}
																className="text-indigo-500/50"
															/>
														) : (
															<Crown size={16} />
														)}
													</button>
													<button
														type="button"
														onClick={() => handleDeleteUser(user.id)}
														className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
														title="Delete User"
													>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{!loading && filteredUsers.length > USERS_PER_PAGE && (
					<div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 px-6 py-4">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Showing {startIndex + 1}–{Math.min(endIndex, filteredUsers.length)} of{" "}
							{filteredUsers.length} users
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={safePage <= 1}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
							>
								<ChevronLeft size={14} />
								Previous
							</button>
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums min-w-[80px] text-center">
								Page {safePage} of {totalPages}
							</span>
							<button
								type="button"
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={safePage >= totalPages}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
							>
								Next
								<ChevronRight size={14} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
