"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RedeemPage() {
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleRedeem = async () => {
		const normalizedCode = code.trim().toUpperCase();

		if (!normalizedCode) {
			toast({
				type: "error",
				description: "Masukkan kode voucher terlebih dahulu.",
			});
			return;
		}

		setLoading(true);

		try {
			const res = await fetch("/api/redeem", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code: normalizedCode }),
			});
			const data = await res.json();

			if (!res.ok || data.error) {
				toast({
					type: "error",
					description: data.error || "Voucher tidak bisa dipakai.",
				});
			} else {
				toast({
					type: "success",
					description: "Voucher berhasil dipakai. Benefit kamu sudah aktif.",
				});
				setCode("");
				setTimeout(() => {
					router.refresh();
				}, 700);
			}
		} catch (_e) {
			toast({
				type: "error",
				description: "Terjadi kesalahan saat memproses voucher.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await handleRedeem();
	};

	return (
		<div className="min-h-screen bg-background px-4 py-10 text-foreground">
			<div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
				<div className="w-full max-w-md rounded-[32px] border border-black/8 bg-[#f8f6f1] p-7 text-[#171717] shadow-[0_28px_80px_rgba(17,19,21,0.10)] dark:border-white/10 dark:bg-[#111315] dark:text-[#f3f4f1]">
					<div className="inline-flex items-center rounded-full border border-black/7 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6e69] shadow-[0_10px_24px_rgba(16,18,20,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#8f948e] dark:shadow-none">
						Redeem Code
					</div>

					<div className="mt-5 space-y-2">
						<h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.04em]">
							Aktifkan benefit kamu
						</h2>
						<p className="text-sm leading-6 text-[#5f6258] dark:text-[#9ea59f]">
							Masukkan voucher yang kamu terima untuk membuka upgrade PRO
							atau credit tambahan.
						</p>
					</div>

					<form className="mt-7 space-y-4" onSubmit={handleSubmit}>
						<Input
							autoCapitalize="characters"
							autoComplete="off"
							className="h-14 rounded-[20px] border-black/8 bg-white/75 px-4 text-base tracking-[0.08em] placeholder:tracking-normal placeholder:text-[#8a8e87] focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/[0.03] dark:placeholder:text-[#7f857f]"
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="ULTRA-XXXXXXXX"
							value={code}
						/>
						<Button
							className="h-12 w-full rounded-full text-sm font-semibold"
							disabled={loading}
							type="submit"
						>
							{loading ? "Memproses..." : "Redeem sekarang"}
						</Button>
					</form>

					<div className="mt-5 rounded-[22px] border border-black/6 bg-white/55 px-4 py-3 text-xs leading-6 text-[#696d66] dark:border-white/8 dark:bg-white/[0.03] dark:text-[#8f948e]">
						Pastikan kode ditulis sesuai format. Jika voucher valid, benefit
						akan aktif otomatis pada akun ini.
					</div>
				</div>
			</div>
		</div>
	);
}
