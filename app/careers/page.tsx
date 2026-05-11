import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Careers",
	description:
		"Join UltramaxoAI — we're hiring exceptional engineers and designers to build the most advanced AI workspace.",
	alternates: { canonical: "/careers" },
	openGraph: {
		title: "Careers | UltramaxoAI",
		description:
			"Join UltramaxoAI — we're hiring exceptional engineers and designers to build the most advanced AI workspace.",
		url: "https://ultramaxo.tech/careers",
	},
};
export default function CareersPage() {
	return (
		<div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 font-body flex flex-col relative overflow-hidden">
			<div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
			<nav className="fixed top-0 left-0 right-0 p-6 z-50">
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="text-sm font-medium">Back to Home</span>
				</Link>
			</nav>
			<main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 mt-20">
				<h1 className="text-5xl md:text-6xl lg:text-7xl font-heading italic tracking-tight mb-8">
					Careers
				</h1>
				<p className="max-w-xl mx-auto text-white/60 text-base md:text-lg leading-relaxed mb-8">
					Join us in building the most advanced AI workspace. We're always
					looking for exceptional talent in engineering and design.
				</p>
				<a
					href="mailto:careers@ultramaxo.tech"
					className="inline-block bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
				>
					View Open Roles
				</a>
			</main>
		</div>
	);
}
