import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 font-body flex flex-col relative overflow-hidden">
			<nav className="fixed top-0 left-0 right-0 p-6 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
				<div className="max-w-4xl mx-auto w-full">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit"
					>
						<ArrowLeft className="w-4 h-4" />
						<span className="text-sm font-medium">Back to Home</span>
					</Link>
				</div>
			</nav>
			<main className="flex-1 w-full max-w-3xl mx-auto p-6 relative z-10 mt-32 mb-20">
				<h1 className="text-4xl md:text-5xl font-heading italic tracking-tight mb-4">
					Privacy Policy
				</h1>
				<p className="text-white/40 text-sm mb-12">Last updated: April 2026</p>

				<div className="space-y-8 text-white/70 leading-relaxed">
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							1. Data Collection
						</h2>
						<p>
							We collect minimal telemetry and usage data necessary to operate
							the Ultramaxo AI workspace. Your chat history and uploaded files
							are securely stored and encrypted at rest.
						</p>
					</section>
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							2. AI Model Usage
						</h2>
						<p>
							When you use BYOK (Bring Your Own Key), your requests are sent
							directly to the respective API providers (e.g., OpenAI,
							Anthropic). We do not store your private API keys in plain text;
							they are encrypted in our database.
						</p>
					</section>
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							3. Data Retention
						</h2>
						<p>
							You have full control over your data. Deleting a chat thread
							removes it permanently from our active databases. We do not use
							your private workspace data to train our foundational models.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
