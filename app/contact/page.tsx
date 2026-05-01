import { ArrowLeft, Mail, Send, Users } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
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
					Contact Us
				</h1>
				<p className="max-w-xl mx-auto text-white/60 text-base md:text-lg leading-relaxed mb-12">
					Have a question or want to talk to sales? Reach out to us through the
					channels below.
				</p>
				<div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<a
						href="mailto:support@ultramaxo.tech"
						className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/10 transition-colors"
					>
						<Mail className="w-5 h-5" />
						<span className="font-medium">support@ultramaxo.tech</span>
					</a>
					<a
						href="https://t.me/iiokans"
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/10 transition-colors"
					>
						<Send className="w-5 h-5" />
						<span className="font-medium">Telegram @iiokans</span>
					</a>
					<a
						href="https://t.me/+CQR8SWdH5nE2OTdk"
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/10 transition-colors sm:col-span-2 lg:col-span-1"
					>
						<Users className="w-5 h-5" />
						<span className="font-medium">Join Telegram Community</span>
					</a>
				</div>
			</main>
		</div>
	);
}
