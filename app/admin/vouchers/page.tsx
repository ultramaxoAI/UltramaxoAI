"use client";

import { useEffect, useState } from "react";
import { TicketIcon, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RedeemCode {
	id: string;
	code: string;
	type: "PRO" | "CREDIT";
	value: number;
	durationMonths: number;
	isUsed: boolean;
	usedBy: string | null;
	usedAt: string | null;
	expiresAt: string | null;
	createdAt: string;
}

export default function AdminVouchersPage() {
	const [codes, setCodes] = useState<RedeemCode[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		code: "",
		type: "PRO" as "PRO" | "CREDIT",
		value: 0,
		durationMonths: 1,
		expiresAt: "",
	});

	const fetchCodes = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/redeem-codes");
			const data = await res.json();
			if (data.codes) setCodes(data.codes);
		} catch {
			toast.error("Failed to load voucher codes");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCodes();
	}, []);

	const generateCode = () => {
		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		let result = "ULTRA-";
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setFormData({ ...formData, code: result });
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.code.trim()) {
			toast.error("Code is required");
			return;
		}
		setCreating(true);
		try {
			const payload: Record<string, unknown> = {
				code: formData.code.trim().toUpperCase(),
				type: formData.type,
				value: formData.type === "CREDIT" ? Math.max(1, formData.value) : 0,
				durationMonths: formData.type === "PRO" ? Math.max(1, formData.durationMonths) : 0,
			};
			if (formData.expiresAt) payload.expiresAt = formData.expiresAt;

			const res = await fetch("/api/admin/redeem-codes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Voucher created");
				setFormData({ code: "", type: "PRO", value: 0, durationMonths: 1, expiresAt: "" });
				fetchCodes();
			} else {
				toast.error(data.error || "Create failed");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setCreating(false);
		}
	};

	const handleCopy = (code: string, id: string) => {
		navigator.clipboard.writeText(code);
		setCopiedId(id);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const usedCount = codes.filter(c => c.isUsed).length;
	const activeCount = codes.filter(c => !c.isUsed).length;

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					Vouchers
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Generate and manage redeem codes for PRO upgrades and credit grants.
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">Total Codes</p>
					<p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{codes.length}</p>
				</div>
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">Active</p>
					<p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
				</div>
				<div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
					<p className="text-xs text-gray-500 font-medium">Redeemed</p>
					<p className="text-xl font-semibold text-gray-400 mt-1">{usedCount}</p>
				</div>
			</div>

			{/* Create Form */}
			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
				<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Create New Voucher</h3>
				<form onSubmit={handleCreate} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Code</span>
							<div className="flex gap-2">
								<input
									type="text"
									value={formData.code}
									onChange={e => setFormData({ ...formData, code: e.target.value })}
									className="flex-1 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-mono dark:text-white focus:outline-none focus:border-indigo-500"
									placeholder="ULTRA-XXXXXXXX"
								/>
								<button
									type="button"
									onClick={generateCode}
									className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-colors dark:text-white"
								>
									Generate
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</span>
							<select
								value={formData.type}
								onChange={e => setFormData({ ...formData, type: e.target.value as "PRO" | "CREDIT" })}
								className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500"
							>
								<option value="PRO">PRO Upgrade</option>
								<option value="CREDIT">Credit Grant</option>
							</select>
						</div>

						{formData.type === "PRO" ? (
							<div className="space-y-2">
								<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration (months)</span>
								<input
									type="number"
									min={1}
									value={formData.durationMonths}
									onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
									className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500"
								/>
							</div>
						) : (
							<div className="space-y-2">
								<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Credit Amount</span>
								<input
									type="number"
									min={1}
									value={formData.value}
									onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
									className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500"
								/>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
						<div className="space-y-2">
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Expiry Date (optional)</span>
							<input
								type="date"
								value={formData.expiresAt}
								onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
								className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
						<div className="md:col-span-2 flex justify-end">
							<button
								disabled={creating}
								type="submit"
								className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
							>
								<Plus size={16} />
								{creating ? "Creating..." : "Create Voucher"}
							</button>
						</div>
					</div>
				</form>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left">
						<thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							<tr>
								<th className="px-6 py-3 font-medium">Code</th>
								<th className="px-6 py-3 font-medium">Type</th>
								<th className="px-6 py-3 font-medium">Details</th>
								<th className="px-6 py-3 font-medium">Status</th>
								<th className="px-6 py-3 font-medium">Created</th>
								<th className="px-6 py-3 font-medium text-right">Copy</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-white/10">
							{loading ? (
								<tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading codes...</td></tr>
							) : codes.length === 0 ? (
								<tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No vouchers created yet.</td></tr>
							) : (
								codes.map(code => (
									<tr key={code.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
										<td className="px-6 py-3">
											<span className="font-mono text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
												{code.code}
											</span>
										</td>
										<td className="px-6 py-3">
											{code.type === "PRO" ? (
												<span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">PRO</span>
											) : (
												<span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded">CREDIT</span>
											)}
										</td>
										<td className="px-6 py-3 text-xs text-gray-500">
											{code.type === "PRO" ? `${code.durationMonths}mo` : `${code.value} credits`}
										</td>
										<td className="px-6 py-3">
											{code.isUsed ? (
												<span className="text-xs text-gray-400">Redeemed</span>
											) : (
												<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
											)}
										</td>
										<td className="px-6 py-3 text-xs text-gray-500">
											{formatDistanceToNow(new Date(code.createdAt), { addSuffix: true })}
										</td>
										<td className="px-6 py-3 text-right">
											<button
												type="button"
												onClick={() => handleCopy(code.code, code.id)}
												className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-md transition-colors"
												title="Copy code"
											>
												{copiedId === code.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
											</button>
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
