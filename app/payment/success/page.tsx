import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4">
			<div className="flex flex-col items-center space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
				<div className="bg-emerald-500/20 p-4 rounded-full">
					<CheckCircleIcon className="w-16 h-16 text-emerald-500" />
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-semibold text-zinc-100">
						Pembayaran Berhasil!
					</h1>
					<p className="text-zinc-400 text-sm">
						Terima kasih! Transaksi Anda telah dikonfirmasi oleh sistem. Lisensi
						Ultra PRO Anda kini seharusnya sudah otomatis aktif.
					</p>
				</div>

				<div className="w-full pt-4 border-t border-zinc-800/50">
					<p className="text-xs text-zinc-500 mb-4 inline-flex items-center gap-1.5">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						Sistem telah diperbarui
					</p>

					<Link
						href="/"
						className="flex w-full mt-2 items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
					>
						Kembali ke Beranda Chat
					</Link>
				</div>
			</div>
		</div>
	);
}
