"use client";

import { CrownIcon } from "lucide-react";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface UpgradeProButtonProps {
	user: User;
	variant?: "default" | "minimal";
	customTrigger?: React.ReactNode;
}

const PLANS = [
	{
		id: "pro-1",
		name: "Early Adopter (Pro) - 1 Bulan",
		months: 1,
		price: 15_000,
		originalPrice: 30_000,
	},
	{
		id: "pro-12",
		name: "1 Tahun - Hemat 58%",
		months: 12,
		price: 150_000,
		originalPrice: 360_000,
	},
];

export function UpgradeProButton({
	user,
	variant = "default",
	customTrigger,
}: UpgradeProButtonProps) {
	const [open, setOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<string>("");
	const [note, setNote] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async () => {
		if (!selectedPlan) {
			toast.error("Pilih paket Pro terlebih dahulu");
			return;
		}

		const plan = PLANS.find((p) => p.id === selectedPlan);
		if (!plan) return;

		setIsLoading(true);

		try {
			const res = await fetch("/api/payment/create-invoice", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					planId: plan.id,
					months: plan.months,
					price: plan.price,
					note: note || undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Gagal membuat invoice");
			}

			toast.success("Invoice berhasil dibuat! Mengalihkan ke pembayaran...");
			setOpen(false);
			
			// Redirect directly to YoBasePay checkout URL
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			} else if (data.requestId) {
				// Fallback to whatsapp if somehow there is no checkout URL but we have a request ID
				const whatsappUrl = `https://wa.me/6285191689131?text=Halo,%20saya%20ingin%20bayar%20invoice%20upgrade%20Pro%20dengan%20ID%20${data.requestId}`;
				window.open(whatsappUrl, "_blank");
			}
		} catch (err) {
			console.error("Payment error:", err);
			toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
		} finally {
			setIsLoading(false);
		}
	};

	// Don't show button if user is already pro
	if (user.type === "pro") {
		return null;
	}

	// Render custom trigger if provided
	const TriggerButton = customTrigger ? (
		<div onClick={() => setOpen(true)}>{customTrigger}</div>
	) : variant === "minimal" ? (
		<button
			className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-white/60 bg-transparent border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors duration-200"
			onClick={() => setOpen(true)}
		>
			<CrownIcon className="h-3 w-3" />
			Upgrade
		</button>
	) : (
		<Button
			className="relative w-full justify-start gap-2 bg-[#111111] hover:bg-white/[0.08] border border-white/[0.08] text-white/85 font-medium shadow-sm transition-all duration-200"
			onClick={() => setOpen(true)}
			size="sm"
		>
			<CrownIcon className="h-4 w-4 text-emerald-400" />
			<span>Upgrade to Pro</span>
		</Button>
	);

	return (
		<>
			{TriggerButton}

			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="sm:max-w-[500px] border-0 bg-black/40 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
					<div className="relative border border-white/10 rounded-2xl bg-linear-to-b from-zinc-900/90 to-black/90 p-6">
						<DialogHeader className="space-y-3">
							<DialogTitle className="flex items-center gap-3 text-xl font-medium">
								<div className="p-1.5 rounded-md bg-white/10 border border-white/10">
									<CrownIcon className="h-5 w-5 text-emerald-400" />
								</div>
								<span className="text-white/90 tracking-tight">
									Upgrade ke Pro
								</span>
							</DialogTitle>
							<DialogDescription className="text-white/50 text-sm leading-relaxed">
								Pilih paket Pro yang sesuai dengan kebutuhan Anda. Admin akan
								meninjau request Anda dan memberikan instruksi pembayaran.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-6 py-6">
							<div className="grid gap-2">
								<Label
									className="text-xs font-medium text-white/70"
									htmlFor="plan"
								>
									Paket Pro
								</Label>
								<Select onValueChange={setSelectedPlan} value={selectedPlan}>
									<SelectTrigger
										className="bg-black/40 border-white/10 text-white/90 rounded-lg h-10 hover:border-white/20 transition-colors text-sm"
										id="plan"
									>
										<SelectValue placeholder="Pilih paket" />
									</SelectTrigger>
									<SelectContent className="bg-[#111111] border-white/10 text-white/90">
										{PLANS.map((plan) => (
											<SelectItem
												className="hover:bg-white/10 focus:bg-white/10 rounded-md my-0.5 text-sm cursor-pointer"
												key={plan.id}
												value={plan.id}
											>
												<span className="text-white/90">{plan.name}</span>
												<span className="mx-2 text-white/30">—</span>
												<span className="line-through text-white/40 text-xs">
													Rp {plan.originalPrice.toLocaleString("id-ID")}
												</span>{" "}
												<span className="font-medium text-emerald-400 ml-1">
													Rp {plan.price.toLocaleString("id-ID")}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-2">
								<Label
									className="text-xs font-medium text-white/70"
									htmlFor="note"
								>
									Catatan (Opsional)
								</Label>
								<Textarea
									className="bg-black/40 border-white/10 text-white/90 placeholder:text-white/30 rounded-lg resize-none hover:border-white/20 transition-colors focus:border-white/30 text-sm"
									id="note"
									onChange={(e) => setNote(e.target.value)}
									placeholder="Tambahkan catatan jika diperlukan..."
									rows={3}
									value={note}
								/>
							</div>

							{selectedPlan && (
								<div className="rounded-lg border border-white/10 bg-white/5 p-4 mt-2">
									<h4 className="font-medium mb-3 text-white/80 text-sm flex items-center gap-2">
										Detail Paket
									</h4>
									<div className="text-sm space-y-2">
										{PLANS.filter((p) => p.id === selectedPlan).map((plan) => (
											<div className="space-y-2" key={plan.id}>
												<div className="flex items-center justify-between text-white/60">
													<span>Durasi:</span>
													<span className="font-medium text-white/80">
														{plan.months} bulan
													</span>
												</div>
												<div className="flex items-center justify-between text-white/60">
													<span>Harga Normal:</span>
													<span className="line-through">
														Rp {plan.originalPrice.toLocaleString("id-ID")}
													</span>
												</div>
												<div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10">
													<span className="font-medium text-white/80">
														Harga Diskon:
													</span>
													<span className="font-medium text-emerald-400">
														Rp {plan.price.toLocaleString("id-ID")}
													</span>
												</div>
												<div>
													<p className="text-[11px] text-emerald-400/80 font-medium">
														Hemat Rp {(plan.originalPrice - plan.price).toLocaleString("id-ID")}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-md text-sm"
								onClick={() => setOpen(false)}
								variant="outline"
								size="sm"
							>
								Batal
							</Button>
							<Button
								className="bg-white text-black hover:bg-white/90 rounded-md disabled:opacity-50 font-medium text-sm"
								disabled={!selectedPlan || isLoading}
								onClick={handleSubmit}
								size="sm"
							>
								{isLoading ? "Memproses..." : "Beli Sekarang"}
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
