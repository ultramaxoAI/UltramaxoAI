import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/queries-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Maintenance | UltramaxoAI",
	description: "UltramaxoAI sedang tidak tersedia untuk sementara waktu.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function MaintenancePage() {
	const settings = await getSiteSettings();
	const title = settings?.maintenanceTitle ?? "We'll be right back.";
	const message =
		settings?.maintenanceMessage ??
		"Lagi ada update kecil. Sebentar lagi balik.";

	return (
		<main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#09090b] text-white selection:bg-white/20">
			{/* Ambient glow */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.15),transparent_70%)]" />
				<div className="absolute bottom-0 right-0 h-[400px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08),transparent_70%)]" />
			</div>

			{/* Noise texture */}
			<div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-6 sm:px-10">
				{/* Header - logo doubles as hidden admin link */}
				<header className="flex items-center justify-between pb-0 pt-8">
					<Link
						href="/login"
						className="group flex items-center gap-2 text-white/40 transition-colors duration-300 hover:text-white/70"
						title="UltramaxoAI"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:scale-110">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.9" />
						</svg>
						<span className="text-xs font-medium tracking-[0.2em] uppercase">
							UltramaxoAI
						</span>
					</Link>
					<div className="flex items-center gap-1.5">
						<span className="relative flex size-2">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-amber-400" />
						</span>
						<span className="text-xs text-white/30">maintenance</span>
					</div>
				</header>

				{/* Main content - centered */}
				<section className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
					{/* Status pill */}
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
						<span className="size-1.5 rounded-full bg-amber-400" />
						<span className="text-xs font-medium tracking-wide text-white/50">
							Sedang maintenance
						</span>
					</div>

					{/* Title */}
					<h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
						<span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
							{title}
						</span>
					</h1>

					{/* Message */}
					<p className="mt-5 max-w-lg text-pretty text-base leading-7 text-white/40 sm:text-lg sm:leading-8">
						{message}
					</p>

					{/* Subtle countdown / action area */}
					<div className="mt-12 flex flex-col items-center gap-6">
						<div className="flex items-center gap-8 text-white/20">
							<div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-[spin_4s_linear_infinite] text-white/15">
								<path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0-2.83-2.83M9.76 9.76 6.93 6.93" strokeLinecap="round" />
							</svg>
							<div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
						</div>
						<p className="text-[13px] text-white/25">
							Nggak perlu refresh. Balik lagi nanti aja.
						</p>
					</div>
				</section>

				{/* Footer */}
				<footer className="flex items-center justify-between border-t border-white/[0.06] py-5 text-xs text-white/20">
					<span>&copy; {new Date().getFullYear()} UltramaxoAI</span>
					<div className="flex items-center gap-5">
						<Link href="/privacy" className="transition-colors hover:text-white/50">
							Privacy
						</Link>
						<Link href="/terms" className="transition-colors hover:text-white/50">
							Terms
						</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}