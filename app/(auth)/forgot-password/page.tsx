"use client";

import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotPasswordForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSendResetLink = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!email) {
			setError("Email harus diisi");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Format email tidak valid");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const text = await response.text();
			let data: { error?: string; message?: string };
			try {
				data = JSON.parse(text) as { error?: string; message?: string };
			} catch {
				throw new Error("Server error: Invalid response");
			}

			if (!response.ok) {
				throw new Error(data.error || "Gagal mengirim link reset");
			}

			setSuccess(
				data.message || "Link reset password telah dikirim ke email Anda",
			);
			setTimeout(() => {
				router.push("/login");
			}, 3000);
		} catch (err) {
			const error = err as Error;
			setError(error.message || "Terjadi kesalahan");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-[#111111] text-slate-200 relative overflow-hidden">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.16),transparent_60%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.9),rgba(0,0,0,0.96))] mix-blend-normal"
			/>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="relative w-full max-w-md z-10"
				initial={{ opacity: 0, y: 20 }}
			>
				<div className="flex items-center justify-center mb-6">
					<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black text-sm font-semibold shadow-lg shadow-emerald-500/20">
						N
					</div>
				</div>

				<div className="rounded-3xl border border-white/10 bg-[#050509]/90 backdrop-blur-xl p-7 shadow-[0_18px_45px_rgba(0,0,0,0.9)]">
					<h1 className="text-2xl font-semibold text-white mb-1 text-center tracking-tight">
						Lupa Password
					</h1>
					<p className="text-zinc-400 text-sm text-center mb-6">
						Masukkan email Anda untuk menerima link reset password
					</p>

					<form className="space-y-4" onSubmit={handleSendResetLink}>
						<div>
							<label
								className="block text-xs font-medium text-zinc-300 mb-2"
								htmlFor="email"
							>
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
								<input
									className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#060711] text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:ring-1 focus:ring-white/30 outline-none transition-all"
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="nama@email.com"
									required
									type="email"
									value={email}
								/>
							</div>
						</div>

						{(error || success) && (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								className={`p-3 rounded-xl text-xs ${
									success
										? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-300"
										: "bg-red-500/10 border border-red-500/50 text-red-300"
								}`}
								initial={{ opacity: 0, y: -10 }}
							>
								{error || success}
							</motion.div>
						)}

						<button
							className="w-full py-2.5 rounded-2xl bg-white text-black font-semibold hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-white/10"
							disabled={loading}
							type="submit"
						>
							{loading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Mengirim...
								</>
							) : (
								<>
									Kirim Link Reset
									<ArrowRight className="w-4 h-4" />
								</>
							)}
						</button>
					</form>
				</div>
			</motion.div>
		</div>
	);
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ForgotPasswordForm />
		</Suspense>
	);
}
