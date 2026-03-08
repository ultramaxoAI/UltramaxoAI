import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/queries-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Maintenance | UltramaxoAI",
	description: "UltramaxoAI sedang tidak tersedia untuk sementara waktu karena ada pembaruan sistem.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function MaintenancePage() {
	const settings = await getSiteSettings();
	const title = settings?.maintenanceTitle ?? "Situs sedang kami rapikan sebentar";
	const message =
		settings?.maintenanceMessage ??
		"Beberapa bagian sedang kami perbarui agar akses berikutnya lebih stabil. Silakan coba lagi beberapa saat lagi.";

	return (
		<main className="relative min-h-[100dvh] overflow-hidden bg-[#f3efe7] text-zinc-900">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,72,25,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(38,43,52,0.08),_transparent_30%)]" />
			<div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(34,34,34,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(34,34,34,0.18)_1px,transparent_1px)] [background-size:36px_36px]" />
			<div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent" />

			<div className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
				<header className="flex items-start justify-between gap-6">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-800/80">
							UltramaxoAI
						</p>
						<p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
							Kami sedang menutup akses publik sebentar untuk memastikan semuanya kembali berjalan dengan rapi.
						</p>
					</div>
					<Link
						href="/login"
						className="rounded-full border border-zinc-300/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-zinc-400 hover:bg-white"
					>
						Masuk admin
					</Link>
				</header>

				<section className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end lg:py-20">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-amber-900/[0.06] px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-amber-900/80">
							<span className="inline-block size-2 rounded-full bg-amber-700" />
							sementara tidak tersedia
						</div>
						<h1 className="mt-7 max-w-4xl text-balance font-serif text-5xl leading-[0.94] tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl">
							{title}
						</h1>
						<p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-700">
							{message}
						</p>
					</div>

					<div className="rounded-[2rem] border border-zinc-300/70 bg-white/75 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
						<p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-500">
							Selama maintenance
						</p>
						<div className="mt-6 space-y-4">
							<div className="rounded-[1.5rem] border border-zinc-200 bg-[#f8f5ef] p-5">
								<p className="text-sm font-semibold text-zinc-900">Akses publik ditahan dulu</p>
								<p className="mt-1.5 text-sm leading-6 text-zinc-600">
									Halaman utama, chat, dan alur biasa akan kembali aktif setelah mode maintenance dimatikan.
								</p>
							</div>
							<div className="rounded-[1.5rem] border border-zinc-200 bg-[#f8f5ef] p-5">
								<p className="text-sm font-semibold text-zinc-900">Akses admin tetap terbuka</p>
								<p className="mt-1.5 text-sm leading-6 text-zinc-600">
									Tim internal masih bisa masuk untuk pengecekan, penyesuaian, dan membuka akses lagi saat semuanya siap.
								</p>
							</div>
						</div>
					</div>
				</section>

				<footer className="flex flex-col gap-3 border-t border-zinc-900/10 pt-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
					<p>Kamu tidak perlu melakukan apa pun. Cukup coba lagi beberapa saat lagi.</p>
					<div className="flex items-center gap-4">
						<Link href="/privacy" className="transition hover:text-zinc-800">
							Privacy
						</Link>
						<Link href="/terms" className="transition hover:text-zinc-800">
							Terms
						</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}