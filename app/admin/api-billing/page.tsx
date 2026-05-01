"use client";

import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Purchase {
	id: string;
	userId: string;
	username?: string;
	email?: string;
	planId: string;
	status: string;
	price: number;
	method: string;
	createdAt: string;
	updatedAt: string;
}

export default function AdminBillingPage() {
	const [purchases, setPurchases] = useState<Purchase[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<string | null>(null);

	const fetchPurchases = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/purchases");
			const data = await res.json();
			if (data.purchases) setPurchases(data.purchases);
		} catch (_error) {
			toast.error("Failed to load purchases");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPurchases();
	}, [fetchPurchases]);

	const handleStatusUpdate = async (id: string, newStatus: string) => {
		setUpdating(id);
		try {
			const res = await fetch("/api/admin/purchases", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status: newStatus }),
			});

			if (res.ok) {
				toast.success("Status updated");
				fetchPurchases();
			} else {
				toast.error("Update failed");
			}
		} catch (_error) {
			toast.error("Network error");
		} finally {
			setUpdating(null);
		}
	};

	const pendingCount = purchases.filter((p) => p.status === "pending").length;
	const paidCount = purchases.filter(
		(p) => p.status === "paid" || p.status === "approved",
	).length;

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					API Billing & Purchases
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Monitor API credit top-ups and user payments.
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">
						Total Transactions
					</p>
					<p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
						{purchases.length}
					</p>
				</div>
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">Pending Payments</p>
					<p className="text-xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
						{pendingCount}
					</p>
				</div>
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">Completed</p>
					<p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
						{paidCount}
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left">
						<thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							<tr>
								<th className="px-6 py-3 font-medium">ID / Ref</th>
								<th className="px-6 py-3 font-medium">User</th>
								<th className="px-6 py-3 font-medium">Plan</th>
								<th className="px-6 py-3 font-medium">Price</th>
								<th className="px-6 py-3 font-medium">Method</th>
								<th className="px-6 py-3 font-medium">Status</th>
								<th className="px-6 py-3 font-medium">Time</th>
								<th className="px-6 py-3 font-medium text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-white/10">
							{loading ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-8 text-center text-gray-500"
									>
										Loading transactions...
									</td>
								</tr>
							) : purchases.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-8 text-center text-gray-500"
									>
										No transactions found.
									</td>
								</tr>
							) : (
								purchases.map((purchase) => (
									<tr
										key={purchase.id}
										className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
									>
										<td className="px-6 py-3">
											<span
												className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[120px] block"
												title={purchase.id}
											>
												{purchase.id.substring(0, 8)}...
											</span>
										</td>
										<td className="px-6 py-3">
											<div className="text-xs font-medium text-gray-900 dark:text-white">
												{purchase.username || "Unknown"}
											</div>
											<div className="text-xs text-gray-500">
												{purchase.email || "No email"}
											</div>
										</td>
										<td className="px-6 py-3">
											<span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
												{purchase.planId}
											</span>
										</td>
										<td className="px-6 py-3 font-medium">
											Rp {purchase.price.toLocaleString("id-ID")}
										</td>
										<td className="px-6 py-3 text-xs text-gray-500 capitalize">
											{purchase.method}
										</td>
										<td className="px-6 py-3">
											{purchase.status === "paid" ||
											purchase.status === "approved" ? (
												<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
													Paid
												</span>
											) : purchase.status === "pending" ? (
												<span className="text-xs font-medium text-amber-600 dark:text-amber-400">
													Pending
												</span>
											) : (
												<span className="text-xs font-medium text-red-600 dark:text-red-400 capitalize">
													{purchase.status}
												</span>
											)}
										</td>
										<td className="px-6 py-3 text-xs text-gray-500">
											{formatDistanceToNow(new Date(purchase.createdAt), {
												addSuffix: true,
											})}
										</td>
										<td className="px-6 py-3 text-right">
											<select
												disabled={updating === purchase.id}
												value={purchase.status}
												onChange={(e) =>
													handleStatusUpdate(purchase.id, e.target.value)
												}
												className="text-xs py-1 px-2 border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-black text-gray-900 dark:text-white"
											>
												<option value="pending">Pending</option>
												<option value="paid">Paid</option>
												<option value="rejected">Rejected</option>
												<option value="approved">Approved</option>
												<option value="cancelled">Cancelled</option>
											</select>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
