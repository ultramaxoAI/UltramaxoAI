import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/queries-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Maintenance | UltramaxoAI",
	description: "UltramaxoAI is temporarily unavailable while maintenance is in progress.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function MaintenancePage() {
	const settings = await getSiteSettings();
	const title = settings?.maintenanceTitle ?? "Scheduled maintenance in progress";
	const message =
		settings?.maintenanceMessage ??
		"UltramaxoAI is temporarily offline while we apply updates and verify system stability.";

	return (
		<main className="relative min-h-[100dvh] overflow-hidden bg-[#0f1115] text-zinc-100">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,158,46,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_28%)]" />
			<div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:28px_28px]" />

			<div className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
				<header className="flex items-center justify-between">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-300/80">
							UltramaxoAI
						</p>
						<p className="mt-2 max-w-sm text-sm text-zinc-400">
							Temporary access window for maintenance and verification.
						</p>
					</div>
					<Link
						href="/login"
						className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-amber-300/30 hover:bg-white/10"
					>
						Admin access
					</Link>
				</header>

				<section className="grid gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-20">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
							<span className="inline-block size-2 rounded-full bg-amber-300" />
							maintenance mode
						</div>
						<h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
							{title}
						</h1>
						<p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-zinc-300 sm:text-lg">
							{message}
						</p>
					</div>

					<div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-7">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
									What stays available
								</p>
								<p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
									Admin tools remain online
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300">
								Controlled rollout
							</div>
						</div>

						<div className="mt-8 space-y-4">
							<div className="rounded-2xl border border-white/8 bg-black/20 p-4">
								<p className="text-sm font-medium text-zinc-200">Public website</p>
								<p className="mt-1 text-sm leading-6 text-zinc-400">
									Temporarily paused while updates are applied.
								</p>
							</div>
							<div className="rounded-2xl border border-white/8 bg-black/20 p-4">
								<p className="text-sm font-medium text-zinc-200">Operations window</p>
								<p className="mt-1 text-sm leading-6 text-zinc-400">
									Admin access remains available through the login screen for verification and rollback.
								</p>
							</div>
						</div>
					</div>
				</section>

				<footer className="flex flex-col gap-3 border-t border-white/8 pt-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
					<p>Service access will resume automatically once maintenance mode is turned off.</p>
					<div className="flex items-center gap-4">
						<Link href="/privacy" className="transition hover:text-zinc-300">
							Privacy
						</Link>
						<Link href="/terms" className="transition hover:text-zinc-300">
							Terms
						</Link>
					</div>
				</footer>
			</div>
		</main>
	);
}