import Link from "next/link";

interface TemplateProps {
	title: string;
	message: string;
}

/* ───────────────────────────────────────────
   MIDNIGHT — dark, centered, purple ambient
   ─────────────────────────────────────────── */
export function MidnightTemplate({ title, message }: TemplateProps) {
	return (
		<main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#09090b] text-white selection:bg-white/20">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.15),transparent_70%)]" />
				<div className="absolute bottom-0 right-0 h-[400px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08),transparent_70%)]" />
			</div>
			<div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-6 sm:px-10">
				<header className="flex items-center justify-between pb-0 pt-8">
					<Link href="/login" className="group flex items-center gap-2 text-white/40 transition-colors duration-300 hover:text-white/70" title="UltramaxoAI">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:scale-110">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.9" />
						</svg>
						<span className="text-xs font-medium uppercase tracking-[0.2em]">UltramaxoAI</span>
					</Link>
					<div className="flex items-center gap-1.5">
						<span className="relative flex size-2">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-amber-400" />
						</span>
						<span className="text-xs text-white/30">maintenance</span>
					</div>
				</header>

				<section className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
						<span className="size-1.5 rounded-full bg-amber-400" />
						<span className="text-xs font-medium tracking-wide text-white/50">Sedang maintenance</span>
					</div>
					<h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
						<span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{title}</span>
					</h1>
					<p className="mt-5 max-w-lg text-pretty text-base leading-7 text-white/40 sm:text-lg sm:leading-8">{message}</p>
					<div className="mt-12 flex flex-col items-center gap-6">
						<div className="flex items-center gap-8 text-white/20">
							<div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-[spin_4s_linear_infinite] text-white/15">
								<path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0-2.83-2.83M9.76 9.76 6.93 6.93" strokeLinecap="round" />
							</svg>
							<div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
						</div>
						<p className="text-[13px] text-white/25">Nggak perlu refresh. Balik lagi nanti aja.</p>
					</div>
				</section>

				<footer className="flex items-center justify-between border-t border-white/[0.06] py-5 text-xs text-white/20">
					<span>&copy; {new Date().getFullYear()} UltramaxoAI</span>
					<div className="flex items-center gap-5">
						<Link href="/privacy" className="transition-colors hover:text-white/50">Privacy</Link>
						<Link href="/terms" className="transition-colors hover:text-white/50">Terms</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}

/* ───────────────────────────────────────────
   AURORA — dark with shifting color mesh
   ─────────────────────────────────────────── */
export function AuroraTemplate({ title, message }: TemplateProps) {
	return (
		<main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050510] text-white selection:bg-indigo-500/30">
			{/* Aurora blobs */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -left-32 top-1/4 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.25),transparent_65%)] blur-3xl" />
				<div className="absolute -right-20 top-1/3 h-[450px] w-[450px] animate-[pulse_6s_ease-in-out_infinite_1s] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.2),transparent_65%)] blur-3xl" />
				<div className="absolute bottom-0 left-1/3 h-[400px] w-[600px] animate-[pulse_10s_ease-in-out_infinite_2s] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_65%)] blur-3xl" />
			</div>

			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-6 sm:px-10">
				<header className="flex items-center justify-between pt-8">
					<Link href="/login" className="group flex items-center gap-2.5 text-white/30 transition-colors hover:text-white/60" title="UltramaxoAI">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:rotate-12">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
						</svg>
						<span className="text-xs font-medium uppercase tracking-[0.2em]">UltramaxoAI</span>
					</Link>
					<div className="flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3 py-1.5">
						<span className="relative flex size-1.5">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-60" />
							<span className="relative inline-flex size-1.5 rounded-full bg-indigo-400" />
						</span>
						<span className="text-[11px] text-white/25">updating</span>
					</div>
				</header>

				<section className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
					{/* Rotating ring */}
					<div className="relative mb-10">
						<div className="absolute inset-0 size-16 animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-white/[0.06]" />
						<div className="flex size-16 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-300/60">
								<path d="M12 6v6l4 2" strokeLinecap="round" />
								<circle cx="12" cy="12" r="10" />
							</svg>
						</div>
					</div>

					<h1 className="max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
						<span className="bg-gradient-to-br from-white via-indigo-100 to-indigo-300/80 bg-clip-text text-transparent">{title}</span>
					</h1>
					<p className="mt-6 max-w-md text-pretty text-base leading-7 text-white/35 sm:text-lg sm:leading-8">{message}</p>

					<div className="mt-14 flex items-center gap-3">
						<div className="h-1 w-8 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-indigo-500/40" />
						<div className="h-1 w-8 animate-[pulse_2s_ease-in-out_infinite_0.3s] rounded-full bg-purple-500/40" />
						<div className="h-1 w-8 animate-[pulse_2s_ease-in-out_infinite_0.6s] rounded-full bg-cyan-500/40" />
					</div>
				</section>

				<footer className="flex items-center justify-between border-t border-white/[0.04] py-5 text-xs text-white/15">
					<span>&copy; {new Date().getFullYear()} UltramaxoAI</span>
					<div className="flex items-center gap-5">
						<Link href="/privacy" className="transition-colors hover:text-white/40">Privacy</Link>
						<Link href="/terms" className="transition-colors hover:text-white/40">Terms</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}

/* ───────────────────────────────────────────
   MINIMAL — clean white, typographic
   ─────────────────────────────────────────── */
export function MinimalTemplate({ title, message }: TemplateProps) {
	return (
		<main className="relative flex min-h-[100dvh] flex-col bg-[#f7f7f5] text-zinc-950 selection:bg-zinc-900/10 dark:bg-[#0b0b0a] dark:text-white">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.55),transparent_28%)] dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%)]" />
			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col px-6 sm:px-10">
				<header className="flex items-center justify-between pt-10">
					<div
						className="text-zinc-400 dark:text-white/30"
						title="UltramaxoAI"
					>
						<span className="text-[11px] font-medium uppercase tracking-[0.28em]">
							UltramaxoAI
						</span>
					</div>
					<div className="flex items-center gap-2 text-zinc-400 dark:text-white/30">
						<span className="size-2 rounded-full bg-amber-400" />
						<span className="text-[11px] uppercase tracking-[0.22em]">
							Maintenance
						</span>
					</div>
				</header>

				<section className="flex flex-1 flex-col justify-center pb-24">
					<div className="mb-10 flex items-center gap-4">
						<div className="h-px w-12 bg-zinc-300 dark:bg-white/10" />
						<span className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-white/30">
							Temporary downtime
						</span>
					</div>
					<h1 className="max-w-2xl text-balance text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-zinc-950 sm:text-5xl lg:text-6xl dark:text-white">
						{title}
					</h1>
					<p className="mt-6 max-w-xl text-pretty text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-white/42">
						{message}
					</p>
					<div className="mt-12 flex items-center gap-5 text-zinc-400 dark:text-white/26">
						<div className="h-px w-12 bg-zinc-300 dark:bg-white/10" />
						<p className="text-[13px]">
							We’re applying updates and will be back shortly.
						</p>
					</div>
				</section>

				<footer className="flex items-center justify-between border-t border-zinc-200/80 py-6 text-xs text-zinc-400 dark:border-white/[0.06] dark:text-white/20">
					<span>&copy; {new Date().getFullYear()} UltramaxoAI</span>
					<span>Service temporarily unavailable</span>
				</footer>
			</div>
		</main>
	);
}

/* ───────────────────────────────────────────
   EMBER — warm dark with orange/red glow
   ─────────────────────────────────────────── */
export function EmberTemplate({ title, message }: TemplateProps) {
	return (
		<main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0c0a09] text-white selection:bg-orange-500/20">
			{/* Ember glow */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 translate-y-1/3 rounded-full bg-[radial-gradient(ellipse,rgba(234,88,12,0.12),transparent_65%)]" />
				<div className="absolute right-0 top-0 h-[300px] w-[400px] translate-x-1/4 -translate-y-1/4 rounded-full bg-[radial-gradient(ellipse,rgba(239,68,68,0.06),transparent_60%)]" />
			</div>
			<div className="pointer-events-none absolute inset-0 opacity-[0.02] [background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-6 sm:px-10">
				<header className="flex items-center justify-between pt-8">
					<Link href="/login" className="group flex items-center gap-2.5 text-white/30 transition-colors hover:text-white/60" title="UltramaxoAI">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:scale-110">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
						</svg>
						<span className="text-xs font-medium uppercase tracking-[0.2em]">UltramaxoAI</span>
					</Link>
					<div className="flex items-center gap-1.5">
						<span className="relative flex size-2">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-500 opacity-60" />
							<span className="relative inline-flex size-2 rounded-full bg-orange-500" />
						</span>
						<span className="text-xs text-white/25">maintenance</span>
					</div>
				</header>

				<section className="flex flex-1 flex-col items-start justify-center pb-20">
					<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-500/10 bg-orange-500/[0.04] px-3.5 py-1.5">
						<span className="size-1.5 rounded-full bg-orange-500" />
						<span className="text-xs font-medium text-orange-300/70">Offline sementara</span>
					</div>
					<h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
						<span className="bg-gradient-to-br from-white via-orange-50 to-orange-200/70 bg-clip-text text-transparent">{title}</span>
					</h1>
					<p className="mt-6 max-w-lg text-pretty text-base leading-7 text-white/35 sm:text-lg sm:leading-8">{message}</p>

					<div className="mt-14 flex items-center gap-3 text-white/10">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-[spin_6s_linear_infinite] text-orange-400/30">
							<path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
						</svg>
						<span className="text-[13px] text-white/20">Bentar lagi selesai.</span>
					</div>
				</section>

				<footer className="flex items-center justify-between border-t border-white/[0.05] py-5 text-xs text-white/15">
					<span>&copy; {new Date().getFullYear()} UltramaxoAI</span>
					<div className="flex items-center gap-5">
						<Link href="/privacy" className="transition-colors hover:text-white/40">Privacy</Link>
						<Link href="/terms" className="transition-colors hover:text-white/40">Terms</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}
