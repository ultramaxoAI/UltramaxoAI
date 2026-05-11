import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "About Us",
	description:
		"Learn about UltramaxoAI — the team building the next generation of intelligent AI workspaces for chat, coding, and document collaboration.",
	alternates: { canonical: "/about" },
	openGraph: {
		title: "About Us | UltramaxoAI",
		description:
			"Learn about UltramaxoAI — the team building the next generation of intelligent AI workspaces.",
		url: "https://ultramaxo.tech/about",
	},
};
export default function AboutPage() {
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
					About Us
				</h1>
				<div className="max-w-2xl mx-auto space-y-6 text-white/60 text-base md:text-lg leading-relaxed">
					<p>
						We are a team of engineers, designers, and researchers building the
						next generation of intelligent workspaces.
					</p>
					<p>
						Ultramaxo AI was founded on the belief that AI should be integrated
						directly into where the work happens, not just act as a disposable
						chatbot.
					</p>
				</div>
			</main>
		</div>
	);
}
